"""Publish a static Vite build to Magalu Object Storage, committing index last.

Uses the S3-compatible put-object command, always with a Magalu endpoint.
Each object gets public-read ACL; the bucket can stay private without ListBucket.
"""

import argparse
from dataclasses import dataclass
import hashlib
from http.client import HTTPException
import mimetypes
import os
from pathlib import Path
import re
import subprocess
import sys
import time
from urllib.error import URLError
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen


REVALIDATE = "public, max-age=0, must-revalidate"
IMMUTABLE = "public, max-age=31536000, immutable"
VERIFY_ATTEMPTS = 6
VERIFY_TIMEOUT = 15


@dataclass(frozen=True)
class Config:
    endpoint: str
    region: str
    bucket: str

    @classmethod
    def from_env(cls):
        endpoint = os.environ.get("MGC_S3_ENDPOINT", "")
        region = os.environ.get("MGC_REGION", "")
        bucket = os.environ.get("MGC_BUCKET", "")
        parsed = urlsplit(endpoint)
        if (
            parsed.scheme != "https"
            or endpoint != f"https://{parsed.netloc}"
            or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*\.magaluobjects\.com", parsed.netloc)
            or parsed.path
            or parsed.query
            or parsed.fragment
        ):
            raise ValueError("MGC_S3_ENDPOINT must be an HTTPS *.magaluobjects.com origin, without a path, port or credentials")
        if not re.fullmatch(r"br-(?:se1|ne1|mgl1)", region) or parsed.hostname != f"{region}.magaluobjects.com":
            raise ValueError("MGC_REGION must match the Magalu endpoint region (for example br-se1)")
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,61}[a-z0-9]", bucket):
            raise ValueError("MGC_BUCKET must be a 3-63 character lowercase DNS name without dots")
        return cls(endpoint, region, bucket)

    def public_url(self, key):
        return f"{self.endpoint}/{self.bucket}/{quote(key, safe='/')}"


@dataclass(frozen=True)
class Asset:
    path: Path
    key: str
    size: int
    sha256: bytes
    cache_control: str


def cache_control(key):
    # Vite's default output is assets/<name>-<hash>.<extension>.
    if key.startswith("assets/") and re.search(r"-[A-Za-z0-9_-]{8}\.[^.]+$", key):
        return IMMUTABLE
    return REVALIDATE


def build_manifest(dist):
    if dist.is_symlink() or not dist.is_dir():
        raise ValueError(f"Build directory does not exist or is a symlink: {dist}")
    assets = []
    for path in sorted(dist.rglob("*")):
        if path.is_symlink():
            raise ValueError(f"Symlinks are not allowed in the build: {path}")
        if path.is_file():
            key = path.relative_to(dist).as_posix()
            body = path.read_bytes()
            assets.append(Asset(path, key, len(body), hashlib.sha256(body).digest(), cache_control(key)))
    if not any(asset.key == "index.html" for asset in assets):
        raise ValueError("Build directory must contain index.html")
    return sorted(assets, key=lambda asset: (asset.key == "index.html", asset.cache_control != IMMUTABLE, asset.key))


def upload(asset, config):
    content_type = {
        ".js": "text/javascript",
        ".css": "text/css",
        ".html": "text/html",
        ".json": "application/json",
        ".svg": "image/svg+xml",
    }.get(asset.path.suffix.lower()) or mimetypes.guess_type(asset.key)[0] or "application/octet-stream"
    environment = os.environ.copy()
    # s3api avoids automatic high-level transfer checksums unsupported by some
    # S3-compatible providers; public GET below verifies the actual file bytes.
    environment.update({
        "AWS_REQUEST_CHECKSUM_CALCULATION": "WHEN_REQUIRED",
        "AWS_RESPONSE_CHECKSUM_VALIDATION": "WHEN_REQUIRED",
        "AWS_EC2_METADATA_DISABLED": "true",
        "AWS_MAX_ATTEMPTS": "3",
    })
    for key in ("AWS_SESSION_TOKEN", "AWS_SECURITY_TOKEN", "AWS_PROFILE", "AWS_DEFAULT_PROFILE"):
        environment.pop(key, None)
    subprocess.run([
        "aws", "s3api", "put-object",
        "--endpoint-url", config.endpoint,
        "--region", config.region,
        "--bucket", config.bucket,
        "--acl", "public-read",
        "--key", asset.key,
        "--body", str(asset.path),
        "--content-type", content_type,
        "--cache-control", asset.cache_control,
        "--no-cli-pager",
    ], check=True, timeout=120, env=environment, stdout=subprocess.DEVNULL)


def verify_public(asset, config):
    """Retry stale/missing objects; never publish index before bytes are visible."""
    request = Request(config.public_url(asset.key), headers={"Cache-Control": "no-cache"})
    for attempt in range(VERIFY_ATTEMPTS):
        try:
            with urlopen(request, timeout=VERIFY_TIMEOUT) as response:
                # Limit reads if an unexpected response contains a larger object.
                body = response.read(asset.size + 1)
                if response.status == 200 and len(body) == asset.size and hashlib.sha256(body).digest() == asset.sha256:
                    return
        except (URLError, OSError, HTTPException):
            pass
        if attempt + 1 < VERIFY_ATTEMPTS:
            time.sleep(min(2 ** attempt, 8))
    raise RuntimeError(f"Public GET did not match the build after {VERIFY_ATTEMPTS} attempts: {asset.key}")


def deploy(dist, config):
    if not os.environ.get("AWS_ACCESS_KEY_ID") or not os.environ.get("AWS_SECRET_ACCESS_KEY"):
        raise ValueError("Set Magalu credentials as AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
    assets = build_manifest(dist)
    # Every dependency is uploaded and verified first. Old assets are retained
    # so browsers with a previously loaded index can continue requesting them.
    for asset in assets:
        print(f"Publishing and verifying {asset.key}", flush=True)
        upload(asset, config)
        verify_public(asset, config)
    print(f"Published {len(assets)} files to {config.public_url('index.html')}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=Path, default=Path("dist"))
    parser.add_argument("--validate", action="store_true", help="Validate public Magalu settings without uploading")
    args = parser.parse_args()
    try:
        config = Config.from_env()
        if args.validate:
            print("Magalu configuration is valid")
        else:
            deploy(args.dist, config)
    except (ValueError, RuntimeError, OSError, subprocess.SubprocessError) as error:
        print(f"Deployment failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Deployment safety tests; no network, credentials or cloud resources required."""

import hashlib
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError, URLError


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "deploy-magalu.py"
SPEC = importlib.util.spec_from_file_location("deploy_magalu", SCRIPT)
deploy_magalu = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = deploy_magalu
SPEC.loader.exec_module(deploy_magalu)

SETTINGS = {
    "MGC_S3_ENDPOINT": "https://br-se1.magaluobjects.com",
    "MGC_REGION": "br-se1",
    "MGC_BUCKET": "portfolio-sergio-prod",
}
CREDENTIALS = {"AWS_ACCESS_KEY_ID": "magalu-test-id", "AWS_SECRET_ACCESS_KEY": "magalu-test-secret"}
CONFIG = deploy_magalu.Config(SETTINGS["MGC_S3_ENDPOINT"], SETTINGS["MGC_REGION"], SETTINGS["MGC_BUCKET"])


class ConfigTests(unittest.TestCase):
    def test_accepts_magalu_origin_and_escapes_object_keys(self):
        with patch.dict("os.environ", SETTINGS, clear=True):
            self.assertEqual(deploy_magalu.Config.from_env(), CONFIG)
        self.assertEqual(CONFIG.public_url("files/currículo #1.pdf"),
                         "https://br-se1.magaluobjects.com/portfolio-sergio-prod/files/curr%C3%ADculo%20%231.pdf")

    def test_rejects_external_or_ambiguous_endpoints(self):
        for endpoint in (
            "", "http://br-se1.magaluobjects.com", "https://s3.amazonaws.com",
            "https://br-se1.magaluobjects.com.attacker.test", "https://br-se1.magaluobjects.com/",
            "https://br-se1.magaluobjects.com/bucket", "https://br-se1.magaluobjects.com?bucket=x",
            "https://br-se1.magaluobjects.com#fragment", "https://br-se1.magaluobjects.com:443",
            "https://br-se1.magaluobjects.com?", "https://br-se1.magaluobjects.com#",
            " https://br-se1.magaluobjects.com", "https://br-se1.magaluobjects.com\n",
            "https://id:secret@br-se1.magaluobjects.com", "https://br-se1.magaluobjects.com@attacker.test",
        ):
            with self.subTest(endpoint=endpoint), patch.dict("os.environ", {**SETTINGS, "MGC_S3_ENDPOINT": endpoint}, clear=True):
                with self.assertRaises(ValueError):
                    deploy_magalu.Config.from_env()

    def test_requires_region_to_match_endpoint(self):
        for region in ("", "us-east-1", "br-ne1", "br-se1/other"):
            with self.subTest(region=region), patch.dict("os.environ", {**SETTINGS, "MGC_REGION": region}, clear=True):
                with self.assertRaises(ValueError):
                    deploy_magalu.Config.from_env()

    def test_accepts_supported_magalu_regions(self):
        for region in ("br-se1", "br-ne1", "br-mgl1"):
            endpoint = f"https://{region}.magaluobjects.com"
            with self.subTest(region=region), patch.dict("os.environ", {**SETTINGS, "MGC_REGION": region, "MGC_S3_ENDPOINT": endpoint}, clear=True):
                config = deploy_magalu.Config.from_env()
                self.assertEqual(config.region, region)
                self.assertEqual(config.endpoint, endpoint)

    def test_rejects_unknown_regions_even_when_endpoint_matches(self):
        for region in ("br-xx1", "br-se2", "us-east-1"):
            with self.subTest(region=region), patch.dict("os.environ", {**SETTINGS, "MGC_REGION": region, "MGC_S3_ENDPOINT": f"https://{region}.magaluobjects.com"}, clear=True):
                with self.assertRaises(ValueError):
                    deploy_magalu.Config.from_env()

    def test_rejects_non_dns_buckets(self):
        for bucket in ("", "ab", "x" * 64, "example.com", "UPPERCASE", "-portfolio", "portfolio-", "some/bucket"):
            with self.subTest(bucket=bucket), patch.dict("os.environ", {**SETTINGS, "MGC_BUCKET": bucket}, clear=True):
                with self.assertRaises(ValueError):
                    deploy_magalu.Config.from_env()

    def test_validation_needs_no_credentials_or_upload(self):
        with patch.dict("os.environ", SETTINGS, clear=True), patch.object(sys, "argv", [str(SCRIPT), "--validate"]), patch.object(deploy_magalu, "deploy") as publish:
            self.assertEqual(deploy_magalu.main(), 0)
            publish.assert_not_called()


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent)
        self.addCleanup(self.temp.cleanup)
        self.dist = Path(self.temp.name)
        self.files = {
            "index.html": b'<script src="./assets/index-Ab12cd34.js"></script>',
            "assets/index-Ab12cd34.js": b'console.log("new build")',
            "assets/style-De34fg56.css": b"body { color: red; }",
            "assets/unversioned.js": b"const value = 1;",
            "manifest.json": b'{"name":"Portfolio"}',
            "logo.svg": b"<svg></svg>",
        }
        for key, body in self.files.items():
            path = self.dist / key
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(body)

    def test_manifest_orders_versioned_assets_then_other_files_then_index(self):
        manifest = deploy_magalu.build_manifest(self.dist)
        self.assertEqual(manifest[-1].key, "index.html")
        self.assertEqual({asset.key for asset in manifest[:2]}, {"assets/index-Ab12cd34.js", "assets/style-De34fg56.css"})
        for asset in manifest:
            self.assertEqual(asset.sha256, hashlib.sha256(self.files[asset.key]).digest())
            self.assertEqual(asset.size, len(self.files[asset.key]))
            expected_cache = deploy_magalu.IMMUTABLE if asset.key in ("assets/index-Ab12cd34.js", "assets/style-De34fg56.css") else deploy_magalu.REVALIDATE
            self.assertEqual(asset.cache_control, expected_cache)
        self.assertEqual(deploy_magalu.cache_control("index-Ab12cd34.js"), deploy_magalu.REVALIDATE)
        self.assertEqual(deploy_magalu.cache_control("assets/file-description.js"), deploy_magalu.REVALIDATE)

    def test_missing_index_stops_before_any_upload(self):
        (self.dist / "index.html").unlink()
        with patch.dict("os.environ", CREDENTIALS, clear=True), patch.object(deploy_magalu, "upload") as upload:
            with self.assertRaisesRegex(ValueError, "index.html"):
                deploy_magalu.deploy(self.dist, CONFIG)
            upload.assert_not_called()

    def test_missing_credentials_stops_before_any_upload(self):
        with patch.dict("os.environ", {}, clear=True), patch.object(deploy_magalu, "upload") as upload:
            with self.assertRaisesRegex(ValueError, "credentials"):
                deploy_magalu.deploy(self.dist, CONFIG)
            upload.assert_not_called()

    def test_uploads_use_magalu_put_object_without_delete_or_acl(self):
        asset = deploy_magalu.build_manifest(self.dist)[0]
        with patch.dict("os.environ", {**CREDENTIALS, "AWS_SESSION_TOKEN": "unrelated-token", "AWS_PROFILE": "unrelated-profile"}, clear=True), patch.object(deploy_magalu.subprocess, "run") as run:
            deploy_magalu.upload(asset, CONFIG)
        command = run.call_args.args[0]
        self.assertEqual(command[:3], ["aws", "s3api", "put-object"])
        for option, expected in (("--endpoint-url", CONFIG.endpoint), ("--region", CONFIG.region), ("--bucket", CONFIG.bucket), ("--key", asset.key), ("--body", str(asset.path)), ("--cache-control", deploy_magalu.IMMUTABLE), ("--content-type", "text/javascript")):
            self.assertEqual(command[command.index(option) + 1], expected)
        self.assertNotIn("--delete", command)
        self.assertNotIn("--acl", command)
        environment = run.call_args.kwargs["env"]
        self.assertEqual(environment["AWS_REQUEST_CHECKSUM_CALCULATION"], "WHEN_REQUIRED")
        self.assertNotIn("AWS_SESSION_TOKEN", environment)
        self.assertNotIn("AWS_PROFILE", environment)
        self.assertTrue(run.call_args.kwargs["check"])
        self.assertEqual(run.call_args.kwargs["timeout"], 120)

    def test_dependencies_are_verified_before_publishing_index(self):
        events = []
        with patch.dict("os.environ", CREDENTIALS, clear=True), patch.object(deploy_magalu, "upload", side_effect=lambda asset, _: events.append(("upload", asset.key))), patch.object(deploy_magalu, "verify_public", side_effect=lambda asset, _: events.append(("verify", asset.key))):
            deploy_magalu.deploy(self.dist, CONFIG)
        expected = [(action, asset.key) for asset in deploy_magalu.build_manifest(self.dist) for action in ("upload", "verify")]
        self.assertEqual(events, expected)
        self.assertEqual(events[-2:], [("upload", "index.html"), ("verify", "index.html")])

    def test_dependency_verification_failure_leaves_index_unpublished(self):
        uploaded = []
        with patch.dict("os.environ", CREDENTIALS, clear=True), patch.object(deploy_magalu, "upload", side_effect=lambda asset, _: uploaded.append(asset.key)), patch.object(deploy_magalu, "verify_public", side_effect=RuntimeError("not visible")):
            with self.assertRaisesRegex(RuntimeError, "not visible"):
                deploy_magalu.deploy(self.dist, CONFIG)
        self.assertEqual(len(uploaded), 1)
        self.assertNotIn("index.html", uploaded)

    def test_upload_failure_leaves_index_unpublished(self):
        with patch.dict("os.environ", CREDENTIALS, clear=True), patch.object(deploy_magalu, "upload", side_effect=subprocess.CalledProcessError(1, "aws")) as upload, patch.object(deploy_magalu, "verify_public") as verify:
            with self.assertRaises(subprocess.CalledProcessError):
                deploy_magalu.deploy(self.dist, CONFIG)
            self.assertNotEqual(upload.call_args.args[0].key, "index.html")
            verify.assert_not_called()


class VerificationTests(unittest.TestCase):
    def setUp(self):
        self.body = b"current build"
        self.asset = deploy_magalu.Asset(Path("dist/index.html"), "index.html", len(self.body), hashlib.sha256(self.body).digest(), deploy_magalu.REVALIDATE)

    def response(self, body, status=200):
        response = MagicMock()
        response.__enter__.return_value = response
        response.status = status
        response.read.return_value = body
        return response

    def test_retries_missing_and_stale_objects_until_checksum_matches(self):
        current = self.response(self.body)
        responses = [HTTPError("url", 404, "missing", {}, None), self.response(b"outdated body"), current]
        with patch.object(deploy_magalu, "urlopen", side_effect=responses) as get, patch.object(deploy_magalu.time, "sleep") as sleep:
            deploy_magalu.verify_public(self.asset, CONFIG)
        self.assertEqual(get.call_count, 3)
        self.assertEqual([call.args[0] for call in sleep.call_args_list], [1, 2])
        request = get.call_args.args[0]
        self.assertEqual(request.get_method(), "GET")
        self.assertEqual(request.full_url, CONFIG.public_url("index.html"))
        self.assertEqual(request.get_header("Cache-control"), "no-cache")
        self.assertEqual(get.call_args.kwargs["timeout"], deploy_magalu.VERIFY_TIMEOUT)
        current.read.assert_called_once_with(len(self.body) + 1)

    def test_same_length_wrong_content_does_not_pass(self):
        with patch.object(deploy_magalu, "urlopen", return_value=self.response(b"X" * len(self.body))) as get, patch.object(deploy_magalu.time, "sleep") as sleep:
            with self.assertRaisesRegex(RuntimeError, "index.html"):
                deploy_magalu.verify_public(self.asset, CONFIG)
        self.assertEqual(get.call_count, deploy_magalu.VERIFY_ATTEMPTS)
        self.assertEqual(sleep.call_count, deploy_magalu.VERIFY_ATTEMPTS - 1)

    def test_network_failure_is_bounded(self):
        with patch.object(deploy_magalu, "urlopen", side_effect=URLError("unavailable")) as get, patch.object(deploy_magalu.time, "sleep"):
            with self.assertRaises(RuntimeError):
                deploy_magalu.verify_public(self.asset, CONFIG)
        self.assertEqual(get.call_count, deploy_magalu.VERIFY_ATTEMPTS)


if __name__ == "__main__":
    unittest.main()

const YEAR = 31_536_000;
const BUCKET_HOST = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.br-(?:se1|ne1|mgl1)\.magaluobjects\.com$/;
const VERSIONED_ASSET = /^\/assets\/[^/]+-[\w-]{8}\.[^.]+$/;

function errorResponse(message, status, method = 'GET', extraHeaders = {}) {
  return new Response(method === 'HEAD' ? null : message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

async function getObject(pathname, method, host) {
  const origin = new URL(`https://${host}`);
  origin.pathname = pathname;
  const immutable = VERSIONED_ASSET.test(pathname);

  // Do not forward cookies, authorization, query strings or S3 control operations.
  return fetch(origin, {
    method,
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
    ...(immutable
      ? { cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': YEAR, '300-599': -1 } } }
      : { cache: 'no-store' }),
  });
}

export default {
  async fetch(request, env) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return errorResponse('Method not allowed', 405, request.method, { Allow: 'GET, HEAD' });
    }

    const url = new URL(request.url);
    // Wrangler's local HTTP server must remain reachable during development.
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.protocol === 'http:' && !loopback) {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 308);
    }

    if (!BUCKET_HOST.test(env.MGC_BUCKET_HOST ?? '')) {
      return errorResponse('Storage is not configured', 503, request.method);
    }

    let pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    try {
      let upstream = await getObject(pathname, request.method, env.MGC_BUCKET_HOST);

      // Only browser navigation can fall back to the SPA. Missing assets stay 404.
      const navigation = request.headers.get('Accept')?.includes('text/html')
        && !pathname.split('/').pop().includes('.');
      if (upstream.status === 404 && navigation) {
        await upstream.body?.cancel();
        pathname = '/index.html';
        upstream = await getObject(pathname, request.method, env.MGC_BUCKET_HOST);
      }

      if (upstream.status !== 200) {
        const status = upstream.status === 404 ? 404 : 502;
        await upstream.body?.cancel();
        return errorResponse(status === 404 ? 'Not found' : 'Storage is unavailable', status, request.method);
      }

      const headers = new Headers(upstream.headers);
      headers.delete('Set-Cookie');
      headers.delete('Content-Disposition');
      headers.set('Cache-Control', VERSIONED_ASSET.test(pathname)
        ? `public, max-age=${YEAR}, immutable`
        : 'public, max-age=0, must-revalidate');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      // Identify the real origin without depending on CDN cache headers.
      headers.set('X-Portfolio-Origin', 'magalu-cloud');

      if (request.method === 'HEAD') await upstream.body?.cancel();
      return new Response(request.method === 'HEAD' ? null : upstream.body, {
        status: upstream.status,
        headers,
      });
    } catch {
      console.error(JSON.stringify({ event: 'magalu_origin_failure', pathname }));
      return errorResponse('Storage is unavailable', 502, request.method);
    }
  },
};

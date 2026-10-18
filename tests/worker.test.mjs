import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import worker from '../infra/cloudflare/worker.mjs';

const env = { MGC_BUCKET_HOST: 'portfolio-sergio-prod.br-se1.magaluobjects.com' };
const request = (path = '/', options) => new Request(`https://portfolio.example${path}`, options);
afterEach(() => mock.restoreAll());

test('root serves index over HTTPS without forwarding cookies, credentials or S3 query strings', async () => {
  const fetch = mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.href, `https://${env.MGC_BUCKET_HOST}/index.html`);
    assert.equal(options.headers, undefined);
    assert.equal(options.cache, 'no-store');
    return new Response('<html>portfolio</html>', { headers: { 'Content-Type': 'text/html', 'Set-Cookie': 'bad=1' } });
  });
  const response = await worker.fetch(request('/?list-type=2', {
    headers: { Cookie: 'session=secret', Authorization: 'Bearer secret' },
  }), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '<html>portfolio</html>');
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate');
  assert.equal(response.headers.get('Set-Cookie'), null);
  assert.equal(response.headers.get('X-Portfolio-Origin'), 'magalu-cloud');
  assert.equal(fetch.mock.callCount(), 1);
});

test('only hashed Vite assets receive long browser and edge cache', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => new Response('asset'));
  const asset = await worker.fetch(request('/assets/index-AbCd1234.js'), env);
  assert.equal(asset.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
  assert.equal(fetch.mock.calls[0].arguments[1].cf.cacheTtlByStatus['300-599'], -1);
  const logo = await worker.fetch(request('/logo.svg'), env);
  assert.equal(logo.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate');
  assert.equal(fetch.mock.calls[1].arguments[1].cache, 'no-store');
  const descriptive = await worker.fetch(request('/assets/file-description.js'), env);
  assert.equal(descriptive.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate');
  assert.equal(fetch.mock.calls[2].arguments[1].cache, 'no-store');
});

test('missing browser navigation falls back to index but missing assets stay 404', async () => {
  const fetch = mock.method(globalThis, 'fetch', async (url) => url.pathname === '/index.html'
    ? new Response('<html>SPA</html>')
    : new Response('NoSuchKey', { status: 404 }));
  const navigation = await worker.fetch(request('/projetos/', { headers: { Accept: 'text/html' } }), env);
  assert.equal(navigation.status, 200);
  assert.equal(await navigation.text(), '<html>SPA</html>');
  const missing = await worker.fetch(request('/assets/missing.js', { headers: { Accept: 'text/html' } }), env);
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('Cache-Control'), 'no-store');
  assert.equal(fetch.mock.callCount(), 3);
});

test('forbidden origin does not silently return SPA or expose bucket error XML', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => new Response('<AccessDenied/>', { status: 403 }));
  const response = await worker.fetch(request('/projetos', { headers: { Accept: 'text/html' } }), env);
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(await response.text(), 'Storage is unavailable');
  assert.equal(fetch.mock.callCount(), 1);
});

test('HEAD preserves object metadata without a body', async () => {
  mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.method, 'HEAD');
    return new Response(null, { headers: { 'Content-Length': '42', ETag: 'abc' } });
  });
  const response = await worker.fetch(request('/', { method: 'HEAD' }), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Length'), '42');
  assert.equal(await response.text(), '');
});

test('write requests and invalid origin configuration never access storage', async () => {
  const fetch = mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected origin request'); });
  const response = await worker.fetch(request('/', { method: 'POST' }), env);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET, HEAD');
  assert.equal((await worker.fetch(request(), { MGC_BUCKET_HOST: 'attacker.example' })).status, 503);
  assert.equal(fetch.mock.callCount(), 0);
});

test('HTTP redirects to HTTPS, and origin failures return uncached 502', async () => {
  const redirect = await worker.fetch(new Request('http://portfolio.example/?a=b'), env);
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('Location'), 'https://portfolio.example/?a=b');
  mock.method(globalThis, 'fetch', async () => { throw new Error('network failure'); });
  mock.method(console, 'error', () => {});
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('local Wrangler development can serve the site over loopback HTTP', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('<html>local</html>'));
  const response = await worker.fetch(new Request('http://localhost:8787/'), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '<html>local</html>');
});

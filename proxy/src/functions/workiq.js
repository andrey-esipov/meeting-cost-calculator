// Burn Rate — Work IQ relay (Azure Functions, Node v4).
// The browser can't call https://workiq.svc.cloud.microsoft/a2a/ directly
// (CORS + it's an agent endpoint). This is a THIN relay: it forwards the
// caller's already-Work-IQ-scoped bearer token and the A2A body upstream, and
// adds CORS headers so the static site can read the reply. It holds NO secrets.
//
// Env:
//   ALLOWED_ORIGIN  e.g. https://andrey-esipov.github.io   (lock to your site)
//   WORKIQ_ENDPOINT optional override (default below)
const { app } = require('@azure/functions');

const UPSTREAM = process.env.WORKIQ_ENDPOINT || 'https://workiq.svc.cloud.microsoft/a2a/';
const ALLOWED = process.env.ALLOWED_ORIGIN || '';   // set this to your site origin

function cors(origin) {
  // Never reflect to '*'. Echo only the configured origin (or the caller's when
  // unconfigured, so local dev works) — but the real gate is the 403 below.
  return {
    'Access-Control-Allow-Origin': ALLOWED || origin || 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, A2A-Version',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

app.http('workiq', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (req, ctx) => {
    const origin = req.headers.get('origin') || '';
    const headers = cors(origin);

    if (req.method === 'OPTIONS') return { status: 204, headers };

    // Enforce the allowlist server-side — CORS only restrains browsers, not
    // curl/server callers, so this relay would otherwise forward any token.
    if (ALLOWED && origin && origin !== ALLOWED) {
      return { status: 403, headers, jsonBody: { error: 'Origin not allowed' } };
    }

    const auth = req.headers.get('authorization');
    if (!auth) return { status: 401, headers, jsonBody: { error: 'Missing Authorization' } };

    let body;
    try { body = await req.text(); } catch { body = '{}'; }

    try {
      const upstream = await fetch(UPSTREAM, {
        method: 'POST',
        headers: {
          'Authorization': auth,                                   // user's WorkIQAgent.Ask token, forwarded as-is
          'Content-Type': 'application/json',
          'A2A-Version': req.headers.get('a2a-version') || '1.0',
        },
        body,
      });
      const text = await upstream.text();
      return {
        status: upstream.status,
        headers: { ...headers, 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
        body: text,
      };
    } catch (e) {
      ctx.error('Work IQ relay failed', e);   // detail stays server-side
      return { status: 502, headers, jsonBody: { error: 'Upstream request failed' } };
    }
  },
});

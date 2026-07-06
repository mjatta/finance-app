const BACKEND_BASE = process.env.VITE_API_BASE_URL || 'https://alakuyateh-001-site10.atempurl.com'

function copyHeaders(src) {
  const out = {};
  for (const [k, v] of Object.entries(src || {})) {
    if (!k) continue;
    const lk = k.toLowerCase();
    if (['host', 'connection', 'content-length'].includes(lk)) continue;
    out[k] = v;
  }
  return out;
}

async function readRawBody(req) {
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    // Ensure we have a working fetch implementation on Vercel Node runtimes
    const fetchFn = (typeof fetch !== 'undefined') ? fetch : (await import('node-fetch')).default;
    const backendUrl = new URL(BACKEND_BASE.replace(/\/$/, ''));
    // ensure path ends with our target path
    backendUrl.pathname = '/api/system/login-attempts';
    backendUrl.search = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

    const headers = copyHeaders(req.headers);
    // Ensure content-type forwarded when present
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await readRawBody(req);
    }

    const fetchRes = await fetchFn(backendUrl.toString(), {
      method: req.method,
      headers,
      body: body && body.length ? body : undefined,
      redirect: 'follow'
    });

    // Copy status and headers
    res.status(fetchRes.status);
    fetchRes.headers.forEach((v, k) => {
      // don't overwrite CORS headers
      if (['access-control-allow-origin','access-control-allow-methods','access-control-allow-headers'].includes(k.toLowerCase())) return;
      res.setHeader(k, v);
    });

    const text = await fetchRes.text();
    // Try to send JSON when possible
    const contentType = fetchRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        res.json(json);
        return;
      } catch (e) {
        // fall through to text
      }
    }

    res.send(text);
  } catch (err) {
    res.status(502).json({ message: 'Proxy error', error: String(err) });
  }
}

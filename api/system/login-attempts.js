const BACKEND_BASE = process.env.VITE_API_BASE_URL || 'https://alakuyateh-001-site10.atempurl.com'
import https from 'https';

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
    const nodeFetchModule = await import('node-fetch').catch(() => null);
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

    let fetchRes;
    try {
      fetchRes = await fetchFn(backendUrl.toString(), {
        method: req.method,
        headers,
        body: body && body.length ? body : undefined,
        redirect: 'follow'
      });
    } catch (err) {
      // Retry with insecure TLS agent if node-fetch is available (handles self-signed certs)
      if (nodeFetchModule) {
        const insecureAgent = new https.Agent({ rejectUnauthorized: false });
        fetchRes = await nodeFetchModule.default(backendUrl.toString(), {
          method: req.method,
          headers,
          body: body && body.length ? body : undefined,
          redirect: 'follow',
          agent: insecureAgent
        });
      } else {
        throw err;
      }
    }

    // Copy status and headers
    // For GET requests, if backend is missing (404) or not OK, serve local persisted attempts
    const text = await fetchRes.text();
    const contentType = fetchRes.headers.get('content-type') || '';
    if (req.method === 'GET' && (!fetchRes.ok || fetchRes.status === 404)) {
      try {
        const fileRaw = await fs.readFile(attemptsFilePath, 'utf-8').catch(() => null);
        if (fileRaw) {
          const parsed = JSON.parse(fileRaw);
          // normalize to an array
          const arr = Array.isArray(parsed) ? parsed : (parsed.rows || parsed.items || []);
          res.status(200).json(arr);
          return;
        }
        // if in-memory fallback exists, return it
        if (Array.isArray(fallbackAttempts) && fallbackAttempts.length > 0) {
          res.status(200).json(fallbackAttempts);
          return;
        }
      } catch (e) {
        // fall through to returning backend response
      }
    }

    res.status(fetchRes.status);
    fetchRes.headers.forEach((v, k) => {
      // don't overwrite CORS headers
      if (['access-control-allow-origin','access-control-allow-methods','access-control-allow-headers'].includes(k.toLowerCase())) return;
      res.setHeader(k, v);
    });
    // If backend returned 404 or not ok for POST, persist locally (dev) or in-memory (prod)
    if ((req.method === 'POST' || req.method === 'PUT') && (fetchRes.status === 404 || fetchRes.status >= 400)) {
      try {
        const parsed = body && body.length ? JSON.parse(body) : { raw: body };
        const entry = { ...parsed, timestamp: new Date().toISOString() };
        // Attempt to persist to the repo file (may succeed on some deployments)
        try {
          const existing = await fs.readFile(attemptsFilePath, 'utf-8').then(JSON.parse).catch(() => []);
          existing.push(entry);
          await fs.writeFile(attemptsFilePath, JSON.stringify(existing, null, 2), 'utf-8');
        } catch (fileErr) {
          // If file write fails (readonly FS), keep in-memory fallback
          fallbackAttempts.push(entry);
        }
        // return created
        res.status(201).json({ saved: true, entry });
        return;
      } catch (e) {
        // ignore persistence errors and fall through to proxy response
      }
    }
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

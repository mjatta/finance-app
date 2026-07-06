const https = require('https');
const fetch = require('node-fetch');

const BACKEND_BASE = process.env.VITE_API_BASE_URL || 'https://alakuyateh-001-site10.atempurl.com';

function copyHeaders(src) {
  const out = {};
  for (const k of Object.keys(src || {})) {
    if (!k) continue;
    const lk = k.toLowerCase();
    if (['host', 'connection', 'content-length'].includes(lk)) continue;
    out[k] = src[k];
  }
  return out;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

let fallbackAttempts = [];

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Quick health response to verify function is deployed
  if (req.method === 'GET' && req.url === '/api/system/login-attempts?health=1') {
    return res.status(200).json({ ok: true, message: 'function alive' });
  }

  try {
    const backendUrl = new URL(BACKEND_BASE.replace(/\/$/, ''));
    backendUrl.pathname = '/api/system/login-attempts';
    backendUrl.search = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

    const headers = copyHeaders(req.headers);
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];

    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') body = await readRawBody(req);

    let fetchRes;
    try {
      fetchRes = await fetch(backendUrl.toString(), { method: req.method, headers, body: body && body.length ? body : undefined, redirect: 'follow' });
    } catch (err) {
      // retry with insecure agent
      const insecureAgent = new https.Agent({ rejectUnauthorized: false });
      fetchRes = await fetch(backendUrl.toString(), { method: req.method, headers, body: body && body.length ? body : undefined, redirect: 'follow', agent: insecureAgent });
    }

    res.status(fetchRes.status);
    fetchRes.headers.forEach((v, k) => {
      if (['access-control-allow-origin','access-control-allow-methods','access-control-allow-headers'].includes(k.toLowerCase())) return;
      res.setHeader(k, v);
    });

    const text = await fetchRes.text();
    const contentType = fetchRes.headers.get('content-type') || '';
    // If backend returned 404 or not ok for POST, persist to in-memory fallback (prod) or to file when possible (dev)
    if ((req.method === 'POST' || req.method === 'PUT') && (fetchRes.status === 404 || fetchRes.status >= 400)) {
      try {
        const parsed = body && body.length ? JSON.parse(body) : { raw: body };
        const entry = { ...parsed, timestamp: new Date().toISOString() };
        try {
          // try writing to file in dev (not available in serverless prod)
          const fs = require('fs').promises;
          const path = require('path');
          if (!process.env.VERCEL) {
            const attemptsFilePath = path.resolve(process.cwd(), 'src/data/login-attempts.json');
            const existing = await fs.readFile(attemptsFilePath, 'utf-8').then(JSON.parse).catch(() => []);
            existing.push(entry);
            await fs.writeFile(attemptsFilePath, JSON.stringify(existing, null, 2), 'utf-8');
            return res.status(201).json({ saved: true, entry });
          }
        } catch (e) {
          // ignore file write errors
        }
        // fallback: in-memory push
        fallbackAttempts.push(entry);
        return res.status(201).json({ saved: true, entry });
      } catch (e) {}
    }
    if (contentType.includes('application/json')) {
      try {
        return res.json(JSON.parse(text));
      } catch (e) {}
    }
    res.send(text);
  } catch (err) {
    res.status(502).json({ message: 'proxy error', error: String(err) });
  }
};

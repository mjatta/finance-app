export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  try {
    const backendRes = await fetch('https://alakuyateh-001-site10.atempurl.com/api/lookups/idtypes', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    const text = await backendRes.text()

    // If backend returns 404, forward the backend response (no local fallback)
    if (backendRes.status === 404) {
      try {
        const parsed = JSON.parse(text)
        res.status(404).json(parsed)
      } catch (parseErr) {
        console.debug('api/id-types: failed to parse 404 body as JSON', parseErr)
        res.setHeader('Content-Type', 'text/plain')
        res.status(404).send(text)
      }
      return
    }

    // Try to parse JSON if possible
    let payload
    try {
      payload = JSON.parse(text)
    } catch (parseErr) {
      console.debug('api/id-types: backend non-JSON response', { status: backendRes.status, bodyPreview: text?.slice?.(0, 200), parseErr })
      // Return as text with backend status
      res.setHeader('Content-Type', 'text/plain')
      res.status(backendRes.status).send(text)
      return
    }

    // Normalize payload to an array of { idtype, id_name }
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.data) ? payload.data : []
    const normalized = items
      .map((it, idx) => ({
        idtype: it?.idtype ?? it?.IdType ?? it?.id ?? idx + 1,
        id_name: (it?.id_name || it?.name || it?.displayName || it?.IdName || '').toString(),
      }))
      .filter((it) => it.id_name && it.idtype !== undefined)

    res.status(200).json(normalized)
  } catch (err) {
    console.error('api/id-types: fetch error', err)
    res.status(502).json({ message: 'Backend service unavailable', error: err.message })
  }
}

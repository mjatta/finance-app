import { useEffect, useState } from 'react'

export default function useAuditTrailTypes() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const resp = await fetch('/api/audittrail/types')
        if (!resp.ok) throw new Error(`Status ${resp.status}`)
        const json = await resp.json()
        // Backend may return array or object; normalize to array
        const items = Array.isArray(json) ? json : (json?.data || json?.rows || [])
        if (mounted) setTypes(items)
      } catch (err) {
        if (mounted) setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [])

  return { types, loading, error }
}

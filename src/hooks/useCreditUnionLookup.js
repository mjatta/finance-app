import { useEffect, useState } from 'react'

export default function useCreditUnionLookup(id = 30) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const resp = await fetch(`/api/lookups/creditunion/${encodeURIComponent(String(id))}`)
        if (!resp.ok) throw new Error(`Status ${resp.status}`)
        const json = await resp.json()
        if (mounted) setData(json)
      } catch (err) {
        if (mounted) setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  return { data, loading, error }
}

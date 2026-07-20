import { useCallback, useState } from 'react'

export default function useGlAccount() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAccount = useCallback(async (accountNumber) => {
    if (!accountNumber) return null
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`/api/glstatement/account/${encodeURIComponent(accountNumber)}`)
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '')
        throw new Error(txt || `Status ${resp.status}`)
      }
      const data = await resp.json()
      return data
    } catch (err) {
      setError(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchAccount, loading, error }
}

import { useCallback, useState } from 'react'

export default function useGlStatement() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStatement = useCallback(async (accountNo, fromDate, toDate) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ accountNo: String(accountNo || ''), fromDate: String(fromDate || ''), toDate: String(toDate || '') })
      const resp = await fetch(`/api/glstatement/statement?${params.toString()}`)
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

  return { fetchStatement, loading, error }
}

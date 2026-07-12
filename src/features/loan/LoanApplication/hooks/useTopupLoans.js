import { useState } from 'react'

export const useTopupLoans = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTopupLoans = async (memcode, compid = 30) => {
    setLoading(true)
    setError(null)
    try {
      if (!memcode) throw new Error('memcode is required')
      const url = `/api/loans/topup?compid=${encodeURIComponent(compid)}&memcode=${encodeURIComponent(memcode)}`
      const res = await fetch(url)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`API error: ${res.status} ${text}`)
      }
      const data = await res.json()
      setLoading(false)
      return data
    } catch (err) {
      setError(err.message || String(err))
      setLoading(false)
      throw err
    }
  }

  return { fetchTopupLoans, loading, error }
}

export default useTopupLoans

import { useState } from 'react'

export const useCheckTopup = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCheckTopup = async (loanId, compid = 30) => {
    setLoading(true)
    setError(null)
    try {
      if (!loanId) throw new Error('loanId is required')
      const url = `/api/Checkloan/check-topup?compid=${encodeURIComponent(compid)}&loanid=${encodeURIComponent(loanId)}`
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

  return { fetchCheckTopup, loading, error }
}

export default useCheckTopup

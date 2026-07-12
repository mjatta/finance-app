import { useState } from 'react'

export const useLoanDetails = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchLoanDetails = async (clientCode, loanId, compid = 30) => {
    setLoading(true)
    setError(null)
    try {
      if (!clientCode) throw new Error('clientCode is required')
      if (!loanId) throw new Error('loanId is required')
      const url = `/api/loans/details?compid=${encodeURIComponent(compid)}&clientCode=${encodeURIComponent(clientCode)}&loanId=${encodeURIComponent(loanId)}`
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

  return { fetchLoanDetails, loading, error }
}

export default useLoanDetails

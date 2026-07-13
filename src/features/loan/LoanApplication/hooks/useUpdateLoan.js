import { useState } from 'react'

export const useUpdateLoan = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const updateLoan = async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/loans/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${text}`)
      }

      setLoading(false)
      return data
    } catch (err) {
      setError(err.message || String(err))
      setLoading(false)
      throw err
    }
  }

  return { updateLoan, loading, error }
}

export default useUpdateLoan

import { useCallback } from 'react'
import { getFullApiUrl } from '../../../../utils/apiConfig'

export function useGenerateAmortization() {
  const generateAmortization = useCallback(async (loanId) => {
    try {
      const url = getFullApiUrl(`/api/loanamortization/generate/${loanId}`)
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(text || `HTTP ${resp.status}`)
      }
      const payload = await resp.json()
      return payload
    } catch (err) {
      console.error('Failed to generate amortization:', err)
      return null
    }
  }, [])

  return { generateAmortization }
}

import { useCallback } from 'react'
import { getFullApiUrl } from '../../../../utils/apiConfig'

export function useCheckAmortization() {
  const checkAmortization = useCallback(async (loanId) => {
    try {
      const url = getFullApiUrl(`/api/loanamortization/check/${loanId}`)
      const resp = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(text || `HTTP ${resp.status}`)
      }
      const payload = await resp.json()
      return payload
    } catch (err) {
      console.error('Failed to check amortization:', err)
      return null
    }
  }, [])

  return { checkAmortization }
}

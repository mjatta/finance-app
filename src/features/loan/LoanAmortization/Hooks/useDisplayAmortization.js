import { useCallback } from 'react'
import { getFullApiUrl } from '../../../../utils/apiConfig'

export function useDisplayAmortization() {
  const displayAmortization = useCallback(async (loanId) => {
    try {
      const url = getFullApiUrl(`/api/loanamortization/display/${loanId}`)
      const resp = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      if (!resp.ok) {
        const text = await resp.text()
        throw new Error(text || `HTTP ${resp.status}`)
      }
      const payload = await resp.json()
      return payload
    } catch (err) {
      console.error('Failed to display amortization:', err)
      return null
    }
  }, [])

  return { displayAmortization }
}

import { useState, useEffect } from 'react'
import { getFullApiUrl } from '../../../../utils/apiConfig'

let cachedBranches = null

export function useCashManagerBranches() {
  const [branches, setBranches] = useState(cachedBranches)
  const [loading, setLoading] = useState(!cachedBranches)
  const [error, setError] = useState(null)

  const fetchBranches = async () => {
    setLoading(true)
    setError(null)
    try {
      // Call the CashManager branches endpoint with companyId=30
      const url = getFullApiUrl('/api/CashManager/branches?companyId=30')
      const res = await fetch(url)
      let data = null
      try {
        data = await res.json()
      } catch (jsonErr) {
        console.error('Failed to parse CashManager branches JSON:', jsonErr)
        data = []
      }
      if (!res.ok) {
        setError((data && data.message) || `Failed to fetch branches (status ${res.status})`)
        setBranches([])
        cachedBranches = null
        return
      }
      setBranches(data)
      cachedBranches = data
    } catch (err) {
      setError(err.message || 'Unknown error')
      setBranches([])
      cachedBranches = null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!cachedBranches) fetchBranches()
  }, [])

  const refresh = () => {
    cachedBranches = null
    fetchBranches()
  }

  return { branches, loading, error, refresh }
}

export default useCashManagerBranches

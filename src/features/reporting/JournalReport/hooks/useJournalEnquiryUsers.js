import { useEffect, useState } from 'react'
import { useAuthStore } from '../../../../store/authStore'

export default function useJournalEnquiryUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const authUser = useAuthStore.getState().user || {}
        const userObj = JSON.parse(localStorage.getItem('user') || '{}')
        const compId = authUser?.CompId || userObj.CompId || userObj.compid || userObj.Compid || userObj.compId || ''
        const params = new URLSearchParams()
        if (compId) params.set('companyId', String(compId))
        const url = `/api/journalenquiry/users${params.toString() ? ('?' + params.toString()) : ''}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        const rows = Array.isArray(data) ? data : (data?.items || data?.rows || [])
        if (mounted) setUsers(rows)
      } catch (err) {
        if (mounted) setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [])

  return { users, loading, error }
}

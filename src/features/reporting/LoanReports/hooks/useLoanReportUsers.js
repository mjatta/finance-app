import { useCallback, useState } from 'react';

export const useLoanReportUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/loan-report/users');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const payload = await resp.json();
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.data) ? payload.data : [];
      const mapped = items
        .map((it) => ({ id: it?.usernumb ?? it?.id, name: (it?.username || it?.user || it?.name || '').toString().trim() }))
        .filter((it) => it.id !== undefined && it.name);
      setUsers(mapped);
    } catch (err) {
      setError(err?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { users, isLoading, error, fetchUsers };
};

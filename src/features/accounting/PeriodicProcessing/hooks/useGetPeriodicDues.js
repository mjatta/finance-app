import { useState, useCallback } from 'react';

export default function useGetPeriodicDues() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPeriodicDues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/periodic-dues');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      let payload;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      // Normalize response to an array
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.rows)
        ? payload.rows
        : [];

      return { success: true, data: rows };
    } catch (err) {
      setError(err.message || 'Failed to fetch periodic dues');
      return { success: false, error: err.message || 'Failed to fetch periodic dues', data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchPeriodicDues, loading, error };
}

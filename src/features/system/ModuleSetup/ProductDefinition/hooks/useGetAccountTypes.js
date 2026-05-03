import { useState, useEffect } from 'react';

/**
 * Hook to fetch account types from Setup/accounttypes endpoint.
 * Returns an array of { acode, adescrip } objects.
 */
export function useGetAccountTypes() {
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/Setup/accounttypes')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch account types');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          const types = Array.isArray(data) ? data : [];
          setAccountTypes(types.map((t) => ({ acode: t.acode, adescrip: t.adescrip?.trim() })));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return { accountTypes, loading, error };
}

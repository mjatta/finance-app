import { useEffect, useState } from 'react';

export function useGetAssetsAccounts() {
  const [assetsAccounts, setAssetsAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadAssetsAccounts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/Setup/accounts/assets');
        if (!response.ok) {
          throw new Error('Failed to fetch assets accounts');
        }

        const payload = await response.json();
        const rows = Array.isArray(payload) ? payload : [];

        if (!cancelled) {
          setAssetsAccounts(
            rows.map((item) => ({
              cacctnumb: item?.cacctnumb || '',
              cacctname: (item?.cacctname || '').trim(),
            })),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load assets accounts');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAssetsAccounts();

    return () => {
      cancelled = true;
    };
  }, []);

  return { assetsAccounts, loading, error };
}

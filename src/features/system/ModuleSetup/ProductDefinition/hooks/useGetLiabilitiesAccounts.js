import { useEffect, useState } from 'react';

export function useGetLiabilitiesAccounts() {
  const [liabilitiesAccounts, setLiabilitiesAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadLiabilitiesAccounts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/Setup/accounts/liabilities');
        if (!response.ok) {
          throw new Error('Failed to fetch liabilities accounts');
        }

        const payload = await response.json();
        const rows = Array.isArray(payload) ? payload : [];

        if (!cancelled) {
          setLiabilitiesAccounts(
            rows.map((item) => ({
              cacctnumb: item?.cacctnumb || '',
              cacctname: (item?.cacctname || '').trim(),
            })),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load liabilities accounts');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLiabilitiesAccounts();

    return () => {
      cancelled = true;
    };
  }, []);

  return { liabilitiesAccounts, loading, error };
}
import { useEffect, useState } from 'react';

export function useGetIncomeAccounts() {
  const [incomeAccounts, setIncomeAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadIncomeAccounts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/Setup/accounts/income');
        if (!response.ok) {
          throw new Error('Failed to fetch income accounts');
        }

        const payload = await response.json();
        const rows = Array.isArray(payload) ? payload : [];

        if (!cancelled) {
          setIncomeAccounts(
            rows.map((item) => ({
              cacctnumb: item?.cacctnumb || '',
              cacctname: (item?.cacctname || '').trim(),
            })),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load income accounts');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadIncomeAccounts();

    return () => {
      cancelled = true;
    };
  }, []);

  return { incomeAccounts, loading, error };
}

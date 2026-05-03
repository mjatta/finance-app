import { useEffect, useState } from 'react';

export function useGetExpenseAccounts() {
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadExpenseAccounts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/Setup/accounts/expense');
        if (!response.ok) {
          throw new Error('Failed to fetch expense accounts');
        }

        const payload = await response.json();
        const rows = Array.isArray(payload) ? payload : [];

        if (!cancelled) {
          setExpenseAccounts(
            rows.map((item) => ({
              cacctnumb: item?.cacctnumb || '',
              cacctname: (item?.cacctname || '').trim(),
            })),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load expense accounts');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadExpenseAccounts();

    return () => {
      cancelled = true;
    };
  }, []);

  return { expenseAccounts, loading, error };
}

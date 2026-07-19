import { useState, useCallback } from 'react';

export const useReconcileTransactions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async (accountNumber) => {
    setLoading(true);
    setError(null);
    try {
      if (!accountNumber) return [];
      const url = `/api/reconcile/transactions/30/${encodeURIComponent(accountNumber)}`;
      const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.Transactions)) return data.Transactions;
      if (Array.isArray(data?.transactions)) return data.transactions;
      return [];
    } catch (err) {
      setError(err.message || String(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchTransactions, loading, error };
};

export default useReconcileTransactions;

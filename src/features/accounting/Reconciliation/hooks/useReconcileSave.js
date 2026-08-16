import { useState, useCallback } from 'react';

export const useReconcileSave = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveReconcile = useCallback(async (transactionIds) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reconcile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ TransactionIds: transactionIds }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return true;
    } catch (err) {
      setError(err.message || String(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveReconcile, loading, error };
};

export default useReconcileSave;

import { useState, useCallback } from 'react';

export const useReconcileSelect = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectTransaction = useCallback(async (tranId, selected) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reconcile/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ TranID: tranId, Selected: selected }),
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

  return { selectTransaction, loading, error };
};

export default useReconcileSelect;

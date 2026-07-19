import { useState, useCallback } from 'react';

export const useEndOfYearData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (accountNo) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/endofyear/data';
      if (accountNo) url += `?AccountNo=${encodeURIComponent(accountNo)}`;
      const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.Accounts)) return data.Accounts;
      if (Array.isArray(data?.accounts)) return data.accounts;
      return [];
    } catch (err) {
      setError(err.message || String(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchData, loading, error };
};

export default useEndOfYearData;

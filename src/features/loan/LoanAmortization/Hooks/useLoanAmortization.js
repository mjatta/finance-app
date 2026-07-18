import { useState, useCallback } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useLoanAmortization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAmortization = useCallback(async (from = 1, to = 30) => {
    setLoading(true);
    setError(null);
    try {
      const url = getFullApiUrl(`/api/loanamortization/clients/${from}/${to}`);
      const resp = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }
      const payload = await resp.json();
      return payload;
    } catch (err) {
      console.error('Failed to fetch loan amortization:', err);
      setError(err.message || 'Failed to fetch loan amortization');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchAmortization, loading, error };
}

import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook for GET /api/interest-calculation/minimum-balance/last-year
 */
export function useLastYearMinimumBalance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLastYearMinimumBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = getFullApiUrl('/api/interest-calculation/minimum-balance/last-year');
      const res = await fetch(url);

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        throw new Error(payload?.Message || payload?.message || `Failed to fetch last year data (status ${res.status})`);
      }

      return { success: true, data: payload };
    } catch (err) {
      const message = err.message || 'Failed to fetch last year minimum balance';
      setError(message);
      return { success: false, errorMessage: message };
    } finally {
      setLoading(false);
    }
  };

  return { getLastYearMinimumBalance, loading, error };
}

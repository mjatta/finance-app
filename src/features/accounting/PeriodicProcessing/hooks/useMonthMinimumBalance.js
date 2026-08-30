import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook for GET /api/interest-calculation/minimum-balance/month
 */
export function useMonthMinimumBalance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getMonthMinimumBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = getFullApiUrl('/api/interest-calculation/minimum-balance/month');
      const res = await fetch(url);

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        throw new Error(payload?.Message || payload?.message || `Failed to fetch month data (status ${res.status})`);
      }

      return { success: true, data: payload };
    } catch (err) {
      const message = err.message || 'Failed to fetch month minimum balance';
      setError(message);
      return { success: false, errorMessage: message };
    } finally {
      setLoading(false);
    }
  };

  return { getMonthMinimumBalance, loading, error };
}

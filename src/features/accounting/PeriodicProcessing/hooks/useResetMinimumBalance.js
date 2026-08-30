import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook for POST /api/interest-calculation/minimum-balance/reset
 * No request body required.
 */
export function useResetMinimumBalance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetMinimumBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = getFullApiUrl('/api/interest-calculation/minimum-balance/reset');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        throw new Error(payload?.Message || payload?.message || `Reset failed (status ${res.status})`);
      }

      return { success: true, data: payload };
    } catch (err) {
      const message = err.message || 'Failed to reset minimum balance';
      setError(message);
      return { success: false, errorMessage: message };
    } finally {
      setLoading(false);
    }
  };

  return { resetMinimumBalance, loading, error };
}

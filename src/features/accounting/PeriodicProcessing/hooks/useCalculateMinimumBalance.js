import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook for POST /api/interest-calculation/minimum-balance/calculate
 * Body: { CompanyId, ProductId, StartYear, StartMonth, EndMonth }
 */
export function useCalculateMinimumBalance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateMinimumBalance = async ({ companyId = 30, productId, startYear, startMonth, endMonth }) => {
    setLoading(true);
    setError(null);
    try {
      const url = getFullApiUrl('/api/interest-calculation/minimum-balance/calculate');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CompanyId: companyId,
          ProductId: productId,
          StartYear: startYear,
          StartMonth: startMonth,
          EndMonth: endMonth,
        }),
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        throw new Error(payload?.Message || payload?.message || `Calculate failed (status ${res.status})`);
      }

      return { success: true, data: payload };
    } catch (err) {
      const message = err.message || 'Failed to calculate minimum balance interest';
      setError(message);
      return { success: false, errorMessage: message };
    } finally {
      setLoading(false);
    }
  };

  return { calculateMinimumBalance, loading, error };
}

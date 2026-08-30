import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook for GET /api/interest-calculation/product/{productId}/rate
 * Returns: { success, productId, interestRate, savingsExpenseAccount, controlAccount }
 */
export function useGetProductRate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getProductRate = async ({ productId }) => {
    setLoading(true);
    setError(null);
    try {
      const url = getFullApiUrl(`/api/interest-calculation/product/${productId}/rate`);
      const res = await fetch(url);

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        throw new Error(payload?.Message || payload?.message || `Failed to fetch product rate (status ${res.status})`);
      }

      return { success: true, data: payload };
    } catch (err) {
      const message = err.message || `Failed to fetch rate for product ${productId}`;
      setError(message);
      return { success: false, errorMessage: message };
    } finally {
      setLoading(false);
    }
  };

  return { getProductRate, loading, error };
}

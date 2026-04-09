import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useLoanProducts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoanProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getFullApiUrl('/api/products/types'), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      let payload;
      try {
        payload = await response.json();
      } catch {
        setError('Invalid response format');
        return [];
      }

      if (payload && payload.status === 'success' && Array.isArray(payload.data)) {
        return payload.data;
      }
      return Array.isArray(payload) ? payload : [];
    } catch (err) {
      console.error('Error fetching loan products:', err);
      setError(err.message || 'Failed to fetch loan products');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { fetchLoanProducts, loading, error };
}

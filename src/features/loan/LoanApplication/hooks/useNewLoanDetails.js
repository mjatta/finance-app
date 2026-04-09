import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useNewLoanDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNewLoanDetails = async (prdId, loanType = 'new') => {
    if (!prdId) {
      setError('Product ID is required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl(`/api/loanproducts/select?prd_id=${encodeURIComponent(prdId)}&loanType=${encodeURIComponent(loanType)}`);
      const response = await fetch(url, {
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
        return null;
      }

      return payload;
    } catch (err) {
      console.error('Error fetching new loan details:', err);
      setError(err.message || 'Failed to fetch new loan details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchNewLoanDetails, loading, error };
}

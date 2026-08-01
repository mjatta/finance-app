import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useGuaranteeHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGuaranteeHistory = async (loanId) => {
    if (!loanId) {
      setError('Loan ID is required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl(`/api/GuaranteeHistorySoFar/guaranteed-history/${loanId}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      
      return payload;
    } catch (err) {
      setError(err.message || 'Failed to fetch guarantee history');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchGuaranteeHistory, loading, error };
}

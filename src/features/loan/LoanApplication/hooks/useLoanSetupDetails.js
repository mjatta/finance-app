import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useLoanSetupDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoanSetupDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl('/api/loan-setup/details');
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
      console.error('Error fetching loan setup details:', err);
      setError(err.message || 'Failed to fetch loan setup details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchLoanSetupDetails, loading, error };
}

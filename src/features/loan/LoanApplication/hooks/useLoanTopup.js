import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useLoanTopup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoanTopup = async (compId, memberCode) => {
    if (!compId || !memberCode) {
      setError('Company ID and Member Code are required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl(`/api/loans/topup?compid=${encodeURIComponent(compId)}&memcode=${encodeURIComponent(memberCode)}`);
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
      console.error('Error fetching loan topup details:', err);
      setError(err.message || 'Failed to fetch loan topup details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchLoanTopup, loading, error };
}

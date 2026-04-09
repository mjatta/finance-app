import { useState } from 'react';
import { getFullApiUrl } from '../../../utils/apiConfig';

export function useCreditUnionDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCreditUnionDetails = async (compId) => {
    if (!compId) {
      setError('Company ID is required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl(`/api/lookups/creditunion/${compId}`);
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

      // Response is an array, get the first item
      if (Array.isArray(payload) && payload.length > 0) {
        return payload[0];
      }

      return payload;
    } catch (err) {
      console.error('Error fetching credit union details:', err);
      setError(err.message || 'Failed to fetch credit union details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchCreditUnionDetails, loading, error };
}

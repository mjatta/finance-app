import { useState } from 'react';
import { buildApiUrl } from '../../../../utils/apiConfig';

export function useGetMemberDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMemberDetails = async (memberCode) => {
    if (!memberCode || !memberCode.trim()) {
      return { data: null, error: 'No member code provided' };
    }

    setLoading(true);
    setError(null);

    try {
      const url = buildApiUrl('remote-member-validate', { membcode: memberCode.trim() });
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 404) {
        const errorMsg = 'Member ID not found';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }

      if (!response.ok) {
        const errorMsg = `HTTP Error: ${response.status} ${response.statusText}`;
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }

      let payload;
      try {
        payload = await response.json();
      } catch {
        const errorMsg = 'Invalid response format';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }

      if (!payload || typeof payload !== 'object') {
        const errorMsg = 'Invalid response structure';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }

      // Check if the API returned an error status with a message
      if (payload.status === 'error' && payload.message) {
        setError(payload.message);
        return { data: null, error: payload.message };
      }

      // Check if the API returned an error message in the payload
      if (payload.message && payload.message.toLowerCase().includes('not found')) {
        setError(payload.message);
        return { data: null, error: payload.message };
      }

      if (payload.error) {
        setError(payload.error);
        return { data: null, error: payload.error };
      }

      setError(null);
      return { data: payload, error: null };
    } catch (err) {
      console.error('Error fetching member details:', err);
      const errorMsg = err.message || 'Failed to fetch member details';
      setError(errorMsg);
      return { data: null, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return { fetchMemberDetails, loading, error };
}

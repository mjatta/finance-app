import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useGetMemberDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMemberDetails = async (memberCode) => {
    if (!memberCode || !memberCode.trim()) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getFullApiUrl(`/api/remote-member/details/${memberCode.trim()}`), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 404) {
        setError('Member not found');
        return null;
      }

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

      if (!payload || typeof payload !== 'object') {
        setError('Invalid response structure');
        return null;
      }

      setError(null);
      return payload;
    } catch (err) {
      console.error('Error fetching member details:', err);
      setError(err.message || 'Failed to fetch member details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchMemberDetails, loading, error };
}

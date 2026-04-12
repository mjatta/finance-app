import { useState, useCallback } from 'react';
import { buildApiUrl } from '../../../../utils/apiConfig';

export function useRejectReasons() {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRejectReasons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = buildApiUrl('loan-reject-reasons', {});
      console.log('Fetching rejection reasons from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Rejection reasons response:', data);

      // Handle array response
      if (Array.isArray(data)) {
        setReasons(data);
        return data;
      }

      // Handle object with reasons array
      if (data && data.reasons && Array.isArray(data.reasons)) {
        setReasons(data.reasons);
        return data.reasons;
      }

      // Handle object with items array
      if (data && data.items && Array.isArray(data.items)) {
        setReasons(data.items);
        return data.items;
      }

      setReasons([]);
      return [];
    } catch (err) {
      console.error('Error fetching rejection reasons:', err);
      setError(err.message || 'Failed to fetch rejection reasons');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { reasons, loading, error, fetchRejectReasons };
}

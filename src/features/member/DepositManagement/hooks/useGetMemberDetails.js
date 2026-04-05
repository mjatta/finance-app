import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

// Hook to fetch member details by member code
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
      const url = getFullApiUrl(`/api/remote-member/details/${memberCode.trim()}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle 404 errors - member not found
      if (response.status === 404) {
        console.warn(`Member not found for code: ${memberCode}`);
        setError('Member not found');
        return null;
      }

      // Handle other HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      // Attempt to parse JSON response
      let payload;
      try {
        payload = await response.json();
      } catch (jsonError) {
        console.warn('Failed to parse member details response as JSON:', jsonError);
        setError('Invalid response format');
        return null;
      }

      // Validate response structure
      if (!payload || typeof payload !== 'object') {
        console.warn('Member details response is not an object:', payload);
        setError('Invalid response structure');
        return null;
      }

      setError(null);
      return payload;
    } catch (err) {
      // Handle network errors and other exceptions
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.error('Network error or CORS issue fetching member details:', err);
      } else {
        console.error('Error fetching member details:', err);
      }
      setError(err.message || 'Failed to fetch member details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchMemberDetails, loading, error };
}

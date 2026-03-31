import { useState, useCallback } from 'react';

// Hook to fetch the recently saved individual user details by member code (calls the correct endpoint)
export function useFetchRecentIndividualDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchRecentIndividualDetails = useCallback(async (memberCode) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      // Use the proxy path to avoid CORS and 404 issues
      const response = await fetch(`/api/remote-member-details/${memberCode}`);
      if (!response.ok) throw new Error('Failed to fetch member details');
      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Unknown error');
      setData(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchRecentIndividualDetails, loading, error, data };
}

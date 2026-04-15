import { useState, useCallback } from 'react';
import { apiFetch } from '../utils/apiConfig';

/**
 * Hook to fetch loan reasons/purposes from the API
 * Maps res_id (ID) and res_name (display name) from the API response
 */
export const useLoanReasons = () => {
  const [loanReasons, setLoanReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoanReasons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('loan-reasons', {
        method: 'GET',
      });

      if (response && response.ok) {
        const data = await response.json();
        // Map the API response to usable format
        // res_id: identifier, res_name: display name
        const mappedReasons = Array.isArray(data)
          ? data.map((item) => ({
              id: item.res_id,
              name: item.res_name.trim(),
            }))
          : [];
        setLoanReasons(mappedReasons);
        return mappedReasons;
      } else {
        throw new Error('Failed to fetch loan reasons');
      }
    } catch (err) {
      console.error('Error fetching loan reasons:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loanReasons,
    loading,
    error,
    fetchLoanReasons,
  };
};

import { useState, useCallback } from 'react';

export const useLoanDisbursementLoad = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoanDisbursementData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        '/api/loan-disbursement/load?compid=30'
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch loan disbursement data';
      setError(errorMsg);
      console.error('Error fetching loan disbursement data:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchLoanDisbursementData, loading, error };
};

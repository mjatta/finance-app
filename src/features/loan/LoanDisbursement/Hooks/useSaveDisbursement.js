import { useState, useCallback } from 'react';

export const useSaveDisbursement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveDisbursement = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        '/api/loan/disburse',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Failed to save disbursement';
      setError(errorMsg);
      console.error('Error saving disbursement:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveDisbursement, loading, error };
};

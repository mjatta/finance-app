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

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.Message || errorData.message || errorMessage;
        } catch {
          // Could not parse error response
        }
        throw new Error(errorMessage);
      }

      const data = responseText ? JSON.parse(responseText) : {};
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

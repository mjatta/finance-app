import { useState, useCallback } from 'react';
import { buildApiUrl } from '../../../../utils/apiConfig';

export function useSaveRejectedLoan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveRejectedLoan = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      if (!payload) {
        throw new Error('Payload is required');
      }

      const apiUrl = buildApiUrl('loan-reject-save', {});

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });


      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Reject error response:', errorBody);
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      let result;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          const text = await response.text();
          result = { message: text, status: 'success' };
        }
      } catch (parseErr) {
        result = { status: 'success', message: 'Loan rejected successfully' };
      }

      setError(null);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to reject loan');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveRejectedLoan, loading, error };
}

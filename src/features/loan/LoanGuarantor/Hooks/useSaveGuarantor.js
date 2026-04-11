import { useState, useCallback } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

// Hook to save guarantor record
export function useSaveGuarantor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveGuarantor = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      if (!payload) {
        throw new Error('Payload is required');
      }

      const response = await fetch(getFullApiUrl('/api/loan/save-guarantor'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        setError(result.message || 'Save failed');
        return null;
      }

      setError(null);
      return result;
    } catch (err) {
      console.error('Error saving guarantor:', err);
      setError(err.message || 'Failed to save guarantor');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveGuarantor, loading, error };
}

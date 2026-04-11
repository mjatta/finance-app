import { useState, useCallback } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

// Hook to fetch guarantors on page load
export function useGuarantorLoad() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGuarantors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getFullApiUrl('/api/guarantor/load?compid=30'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();

      // Payload structure: { status, systemDate, guarantorPercent, firstClient, clientList, guarantorHistory }
      if (!payload || typeof payload !== 'object') {
        setError('Invalid response structure');
        return null;
      }

      setError(null);
      return payload;
    } catch (err) {
      console.error('Error fetching guarantors:', err);
      setError(err.message || 'Failed to fetch guarantors');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchGuarantors, loading, error };
}

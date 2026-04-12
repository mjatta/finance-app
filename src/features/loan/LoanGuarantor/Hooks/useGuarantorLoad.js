import { useState, useCallback } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';
import { useAuthStore } from '../../../../store/authStore';

// Hook to fetch guarantors on page load
export function useGuarantorLoad() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGuarantors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const user = useAuthStore.getState().user;
      const compId = parseInt(user?.CompId, 10) || 30;

      const response = await fetch(getFullApiUrl(`/api/guarantor/load?compid=${compId}`), {
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

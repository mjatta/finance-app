import { useState, useCallback } from 'react';

// Hook to fetch members pending activation
export function useMembersForActivation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMembersForActivation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/remote-member-activate?memberactivate=0', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();

      if (!Array.isArray(payload)) {
        setError('Invalid response structure');
        return null;
      }

      setError(null);
      return payload;
    } catch (err) {
      console.error('Error fetching members for activation:', err);
      setError(err.message || 'Failed to fetch members');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchMembersForActivation, loading, error };
}

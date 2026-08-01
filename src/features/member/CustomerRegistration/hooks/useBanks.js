import { useState, useEffect } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

// Hook to fetch banks from the API
export function useBanks() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBanks = async () => {
      try {
        setLoading(true);
        const url = getFullApiUrl('/api/banks');
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch banks: ${response.statusText}`);
        }

        const data = await response.json();
        // API returns array directly
        const banksArray = Array.isArray(data) ? data : (data.banks || data.data || []);
        setBanks(banksArray);
        setError(null);
      } catch (err) {
        console.error('Error fetching banks:', err);
        setError(err.message);
        setBanks([]);
      } finally {
        setLoading(false);
      }
    };

    loadBanks();
  }, []);

  return { banks, loading, error };
}

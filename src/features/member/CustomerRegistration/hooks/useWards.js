import { useState, useEffect } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

// Default fallback wards if API endpoint is not available
const DEFAULT_WARDS = [
  { id: 1, name: 'Ward 1' },
  { id: 2, name: 'Ward 2' },
  { id: 3, name: 'Ward 3' },
  { id: 4, name: 'Ward 4' },
];

// Hook to fetch wards from the API with fallback to default wards
export function useWards() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWards = async () => {
      try {
        setLoading(true);
        // Use relative path so Vite proxy can intercept and handle CORS
        const url = getFullApiUrl('/api/lookups/wards');

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Handle 404 errors - API endpoint doesn't exist
        if (response.status === 404) {
          console.warn('Wards API endpoint not found (404), using default wards');
          setWards(DEFAULT_WARDS);
          setError(null);
          return;
        }

        // Handle other HTTP errors
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        // Attempt to parse JSON response
        let payload;
        try {
          payload = await response.json();
        } catch (jsonErr) {
          console.error('Invalid JSON response from wards API:', jsonErr);
          throw new Error('Invalid JSON response from wards API');
        }


        // Determine the array to process
        let wardArray = [];
        if (Array.isArray(payload)) {
          wardArray = payload;
        } else if (payload && typeof payload === 'object') {
          // Try common property names: result, data, items, wards
          wardArray = payload.result || payload.data || payload.items || payload.wards || [];
        }

        // Map and deduplicate wards
        const wardOptions = Array.from(
          new Set(
            (Array.isArray(wardArray) ? wardArray : [])
              .map((item, index) => ({
                id: item?.ward_id !== undefined ? item.ward_id : (item?.id || index + 1),
                name: (item?.ward_name || item?.name || '').trim(),
              }))
              .filter((item) => item.name)
          )
        ).sort((a, b) => a.name.localeCompare(b.name));


        if (wardOptions.length === 0) {
          console.warn('No wards found in API response, using default wards');
          setWards(DEFAULT_WARDS);
        } else {
          setWards(wardOptions);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching wards:', err.message);
        
        // On any error, fallback to default wards
        console.warn('Falling back to default wards due to:', err.message);
        setWards(DEFAULT_WARDS);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadWards();
  }, []);

  return { wards, loading, error };
}

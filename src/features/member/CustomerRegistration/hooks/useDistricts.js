import { useState, useEffect } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

// Default fallback districts if API endpoint is not available
const DEFAULT_DISTRICTS = [
  { id: 1, name: 'Banjul' },
  { id: 2, name: 'Kanifing' },
  { id: 3, name: 'Brikama' },
  { id: 4, name: 'Mansakonko' },
  { id: 5, name: 'Kaur' },
  { id: 6, name: 'Keur Simbad' },
  { id: 7, name: 'Kerewan' },
  { id: 8, name: 'Kuntaur' },
  { id: 9, name: 'Janjanbureh' },
  { id: 10, name: 'Basse' },
];

// Hook to fetch districts/areas from the API with fallback to default districts
export function useDistricts() {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDistricts = async () => {
      try {
        setLoading(true);
        // Use relative path so Vite proxy can intercept and handle CORS
        const url = getFullApiUrl('/api/lookups/areas');
        console.log('Fetching districts from:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('Districts API response status:', response.status);

        // Handle 404 errors - API endpoint doesn't exist
        if (response.status === 404) {
          console.warn('Districts API endpoint not found (404), using default districts');
          setDistricts(DEFAULT_DISTRICTS);
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
          console.error('Invalid JSON response from districts API:', jsonErr);
          throw new Error('Invalid JSON response from districts API');
        }

        console.log('Districts API payload:', payload);

        // Determine the array to process
        let districtArray = [];
        if (Array.isArray(payload)) {
          districtArray = payload;
        } else if (payload && typeof payload === 'object') {
          // Try common property names: result, data, items, areas, districts
          districtArray = payload.result || payload.data || payload.items || payload.areas || payload.districts || [];
        }

        // Map and deduplicate districts
        const districtOptions = Array.from(
          new Set(
            (Array.isArray(districtArray) ? districtArray : [])
              .map((item, index) => ({
                id: item?.area_id !== undefined ? item.area_id : (item?.id || index + 1),
                name: (item?.area_name || item?.name || '').trim(),
              }))
              .filter((item) => item.name)
          )
        ).sort((a, b) => a.name.localeCompare(b.name));

        console.log('Processed districts:', districtOptions);

        if (districtOptions.length === 0) {
          console.warn('No districts found in API response, using default districts');
          setDistricts(DEFAULT_DISTRICTS);
        } else {
          setDistricts(districtOptions);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching districts:', err.message);
        
        // On any error, fallback to default districts
        console.warn('Falling back to default districts due to:', err.message);
        setDistricts(DEFAULT_DISTRICTS);
        
        // Still track the error but with default districts available
        let errorMsg = err.message;
        if (err.message.includes('Failed to fetch')) {
          errorMsg = 'Using default districts (API unreachable - possible CORS issue)';
        }
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadDistricts();
  }, []);

  return { districts, loading, error };
}

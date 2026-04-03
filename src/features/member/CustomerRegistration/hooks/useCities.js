import { useState, useEffect } from 'react';

// Default fallback cities if API endpoint is not available
const DEFAULT_CITIES = [
  { id: 1, name: 'Banjul' },
  { id: 2, name: 'Bakau' },
  { id: 3, name: 'Brikama' },
  { id: 4, name: 'Fajara' },
  { id: 5, name: 'Kairaba' },
  { id: 6, name: 'Kingston' },
  { id: 7, name: 'Lamin' },
  { id: 8, name: 'Manjai' },
  { id: 9, name: 'Serrekunda' },
  { id: 10, name: 'Westfield' },
];

// Hook to fetch cities from the API with fallback to default cities
export function useCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/remote-cities/cities', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Handle 404 errors - API endpoint doesn't exist
        if (response.status === 404) {
          console.warn('Cities API endpoint not found (404), using default cities');
          setCities(DEFAULT_CITIES);
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
          console.error('Invalid JSON response from cities API:', jsonErr);
          throw new Error('Invalid JSON response from cities API');
        }

        const cityOptions = Array.from(
          new Set(
            (Array.isArray(payload) ? payload : [])
              .map((item, index) => ({
                id: item?.city_id || item?.id || index + 1,
                name: (item?.city_name || item?.cityName || item?.name || '').trim(),
              }))
              .filter((item) => item.name)
          )
        ).sort((a, b) => a.name.localeCompare(b.name));

        if (cityOptions.length === 0) {
          console.warn('No cities found in API response, using default cities');
          setCities(DEFAULT_CITIES);
        } else {
          setCities(cityOptions);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching cities:', err.message);
        
        // On any error, fallback to default cities
        console.warn('Falling back to default cities due to:', err.message);
        setCities(DEFAULT_CITIES);
        
        // Still track the error but with default cities available
        let errorMsg = err.message;
        if (err.message.includes('Failed to fetch')) {
          errorMsg = 'Using default cities (API unreachable - possible CORS issue)';
        }
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadCities();
  }, []);

  return { cities, loading, error };
}

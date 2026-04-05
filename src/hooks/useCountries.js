import { useState, useEffect } from 'react';
import { getFullApiUrl } from '../utils/apiConfig';

// Simple in-memory cache for countries
let cachedCountries = null;

/**
 * Custom hook to fetch and cache countries across the app.
 * Calls /api/lookups/countries (proxied to avoid CORS).
 * @returns {Object} { countries, loading, error, refresh }
 */
export function useCountries() {
  const [countries, setCountries] = useState(cachedCountries);
  const [loading, setLoading] = useState(!cachedCountries);
  const [error, setError] = useState(null);

  const fetchCountries = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = getFullApiUrl('/api/lookups/countries');
      const res = await fetch(url);
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        data = [];
      }
      if (!res.ok) {
        setError((data && data.message) || `Failed to fetch countries (status ${res.status})`);
        setCountries([]);
        cachedCountries = null;
        return;
      }
      setCountries(data);
      cachedCountries = data;
    } catch (err) {
      setError(err.message || 'Unknown error');
      setCountries([]);
      cachedCountries = null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedCountries) {
      fetchCountries();
    }
  }, []);

  // Optionally allow manual refresh
  const refresh = () => {
    cachedCountries = null;
    fetchCountries();
  };

  return { countries, loading, error, refresh };
}

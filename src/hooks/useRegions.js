import { useState, useEffect } from 'react';
import { getFullApiUrl } from '../utils/apiConfig';

// Simple in-memory cache for regions
let cachedRegions = null;

/**
 * Custom hook to fetch and cache regions (counties) from the API.
 * Calls /api/lookups/counties
 * @returns {Object} { regions, loading, error, refresh }
 */
export function useRegions() {
  const [regions, setRegions] = useState(cachedRegions);
  const [loading, setLoading] = useState(!cachedRegions);
  const [error, setError] = useState(null);

  const fetchRegions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use relative path so Vite proxy can intercept and handle CORS
      const url = getFullApiUrl('/api/lookups/counties');
      const res = await fetch(url);
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        // If response is not JSON, fallback to empty array
        console.error('Failed to parse regions JSON:', jsonErr);
        data = [];
      }
      if (!res.ok) {
        setError((data && data.message) || `Failed to fetch regions (status ${res.status})`);
        setRegions([]);
        cachedRegions = null;
        return;
      }
      setRegions(data);
      cachedRegions = data;
    } catch (err) {
      setError(err.message || 'Unknown error');
      setRegions([]);
      cachedRegions = null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedRegions) {
      fetchRegions();
    }
  }, []);

  const refresh = () => {
    cachedRegions = null;
    fetchRegions();
  };

  return { regions: regions || [], loading, error, refresh };
}

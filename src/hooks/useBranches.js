import { useState, useEffect } from 'react';
import { getFullApiUrl } from '../utils/apiConfig';

// Simple in-memory cache for branches
let cachedBranches = null;

/**
 * Custom hook to fetch and cache branches across the app.
 * Calls /api/lookups/branches (proxied to avoid CORS).
 * @returns {Object} { branches, loading, error, refresh }
 */
export function useBranches() {
  const [branches, setBranches] = useState(cachedBranches);
  const [loading, setLoading] = useState(!cachedBranches);
  const [error, setError] = useState(null);

  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = getFullApiUrl('/api/lookups/branches');
      const res = await fetch(url);
      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        // If response is not JSON, fallback to empty array
        console.error('Failed to parse branches JSON:', jsonErr);
        data = [];
      }
      if (!res.ok) {
        setError((data && data.message) || `Failed to fetch branches (status ${res.status})`);
        setBranches([]);
        cachedBranches = null;
        return;
      }
      setBranches(data);
      cachedBranches = data;
    } catch (err) {
      setError(err.message || 'Unknown error');
      setBranches([]);
      cachedBranches = null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedBranches) {
      fetchBranches();
    }
  }, []);

  // Optionally allow manual refresh
  const refresh = () => {
    cachedBranches = null;
    fetchBranches();
  };

  return { branches, loading, error, refresh };
}

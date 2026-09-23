import { useCallback, useState } from 'react';
import { getFullApiUrl } from '../utils/apiConfig';

/**
 * Global hook to search members by name or code
 * Uses the unified /api/member/search endpoint
 * Returns array of matching members with ccustcode, ccustname, cstreet, etc.
 */
export const useSearchMembers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchMembers = useCallback(async (searchValue) => {
    if (!searchValue || searchValue.trim().length < 1) {
      return { success: true, data: [] };
    }

    setLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl(`/api/member/search?search=${encodeURIComponent(String(searchValue).trim())}`);
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      // Handle different response shapes
      let results = [];
      if (Array.isArray(data)) {
        results = data;
      } else if (Array.isArray(data?.data)) {
        results = data.data;
      } else if (data?.data) {
        results = [data.data];
      } else if (data) {
        results = [data];
      }

      return { success: true, data: results };
    } catch (err) {
      setError(err.message || 'Failed to search members');
      return { success: false, error: err.message || 'Failed to search members', data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchMembers, loading, error };
};

import { useCallback, useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook for searching institutions by name/code/ID from backend
 * GET /api/getmember?search={searchValue}
 */
export const useSearchInstitutionByName = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchInstitutions = useCallback(async (searchValue) => {
    if (!searchValue || searchValue.trim().length < 1) {
      return { success: true, data: [] };
    }

    setLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl(`/api/getmember?search=${encodeURIComponent(String(searchValue).trim())}`);
      const res = await fetch(url);

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const responseData = await res.json();
      let results = [];

      // Handle different response shapes
      if (Array.isArray(responseData)) {
        results = responseData;
      } else if (responseData?.data) {
        if (Array.isArray(responseData.data)) {
          results = responseData.data;
        } else if (typeof responseData.data === 'object') {
          results = [responseData.data];
        }
      } else if (typeof responseData === 'object') {
        results = [responseData];
      }

      return { success: true, data: results };
    } catch (err) {
      setError(err.message || 'Failed to search institutions');
      return { success: false, data: [], error: err.message || 'Failed to search institutions' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchInstitutions, loading, error };
};

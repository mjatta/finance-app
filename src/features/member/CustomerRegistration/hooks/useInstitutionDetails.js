import { useCallback, useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook to fetch institution details by flexible search
 * GET /api/getmember?search={searchValue}
 */
export const useInstitutionDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInstitutionDetails = useCallback(async (searchValue) => {
    setLoading(true);
    setError(null);
    try {
      if (!searchValue) throw new Error('Institution search value is required');
      const url = getFullApiUrl(`/api/getmember?search=${encodeURIComponent(String(searchValue).trim())}`);
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = await res.json();
      // Endpoint always returns an array (even for an exact code match) — unwrap to the first record.
      let payload = data;
      if (Array.isArray(data)) {
        payload = data[0] || {};
      } else if (Array.isArray(data?.data)) {
        payload = data.data[0] || {};
      } else {
        payload = data?.data ?? data ?? {};
      }
      return { success: true, data: payload };
    } catch (err) {
      setError(err.message || 'Failed to fetch institution details');
      return { success: false, error: err.message || 'Failed to fetch institution details' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchInstitutionDetails, loading, error };
};

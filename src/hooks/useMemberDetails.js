import { useCallback, useState } from 'react';
import { getFullApiUrl } from '../utils/apiConfig';

/**
 * Hook to fetch member details by flexible search (code, name, or ID card number)
 * GET /api/getmemberdetails?search={searchValue}
 */
export const useMemberDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMemberDetails = useCallback(async (searchValue) => {
    setLoading(true);
    setError(null);

    try {
      if (!searchValue) throw new Error('Search value is required');
      const url = getFullApiUrl(`/api/getmemberdetails?search=${encodeURIComponent(String(searchValue).trim())}`);
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
      setError(err.message || 'Failed to fetch member details');
      return { success: false, error: err.message || 'Failed to fetch member details' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchMemberDetails, loading, error };
};

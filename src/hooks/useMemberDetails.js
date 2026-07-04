import { useCallback, useState } from 'react';
import { getFullApiUrl } from '../utils/apiConfig';

/**
 * Hook to fetch member details by member code
 * GET /api/getmemberdetails/{memberCode}
 */
export const useMemberDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMemberDetails = useCallback(async (memberCode) => {
    setLoading(true);
    setError(null);

    try {
      if (!memberCode) throw new Error('Member code is required');
      const url = getFullApiUrl(`/api/getmemberdetails/${encodeURIComponent(String(memberCode).trim())}`);
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = await res.json();

      // Normalize response payload: try several shapes
      const payload = data?.data ?? data ?? {};
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

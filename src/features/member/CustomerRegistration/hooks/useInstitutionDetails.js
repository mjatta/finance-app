import { useCallback, useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook to fetch institution details by institution code (feature-scoped)
 * GET /api/getmember/{institutionCode}
 */
export const useInstitutionDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInstitutionDetails = useCallback(async (code) => {
    setLoading(true);
    setError(null);
    try {
      if (!code) throw new Error('Institution code is required');
      const url = getFullApiUrl(`/api/getmember/${encodeURIComponent(String(code).trim())}`);
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const payload = data?.data ?? data ?? {};
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

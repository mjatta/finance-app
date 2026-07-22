import { useState } from 'react';

/**
 * Custom hook to fetch member details by customer code.
 * @returns {Object} { memberDetails, loading, error, fetchMemberDetails }
 */
export function useGetMemberAccountDetails() {
  const [memberDetails, setMemberDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMemberDetails = async (customerCode) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/member-account/member/30/${encodeURIComponent(customerCode)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to fetch member details');
      const data = await resp.json();

      // Handle both direct data and nested response formats
      const details = data.data || data;
      setMemberDetails(details);
      return details;
    } catch (err) {
      setError(err.message || 'Unknown error');
      setMemberDetails(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { memberDetails, loading, error, fetchMemberDetails };
}

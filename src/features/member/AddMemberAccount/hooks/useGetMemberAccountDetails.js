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
      // Pad customer code to 6 digits with leading zeros (e.g., 3 -> 000003, 13 -> 000013)
      const paddedCode = String(customerCode).padStart(6, '0');
      const url = `/api/member-account/member/30/${encodeURIComponent(paddedCode)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to fetch member details');
      const data = await resp.json();

      // Handle both direct data and nested response formats
      let details = data.data || data;
      
      // If response is an array, extract the first element
      if (Array.isArray(details) && details.length > 0) {
        details = details[0];
      }
      
      // Ensure membname is extracted and trimmed for consistency
      if (details && details.membname && typeof details.membname === 'string') {
        details.membname = details.membname.trim();
      }
      
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

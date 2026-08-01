import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useMemberDetails() {
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMemberDetails = async (customerCode) => {
    try {
      setLoading(true);
      setError(null);
      setMemberData(null);

      if (!customerCode.trim()) {
        setError('Customer code is required');
        return;
      }

      // Pad customer code with zeros to 6 digits
      const paddedCode = customerCode.trim().padStart(6, '0');

      const url = getFullApiUrl(`/api/member/details/${paddedCode}/C`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Handle array response directly
      if (Array.isArray(data) && data.length > 0) {
        setMemberData(data[0]);
        return;
      }

      // Handle object response
      if (data && typeof data === 'object') {
        setMemberData(data);
        return;
      }

      setError('No member found with this customer code');
    } catch (err) {
      console.error('Error fetching member details:', err);
      setError(err.message || 'Failed to fetch member details');
      setMemberData(null);
    } finally {
      setLoading(false);
    }
  };

  return { memberData, loading, error, fetchMemberDetails };
}

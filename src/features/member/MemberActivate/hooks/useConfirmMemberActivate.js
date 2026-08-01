import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useConfirmMemberActivate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const confirmActivate = async (customerCode) => {
    try {
      setLoading(true);
      setError(null);

      // Pad customer code with zeros to 6 digits
      const paddedCode = customerCode.trim().padStart(6, '0');

      const payload = {
        MemberCode: paddedCode,
      };


      const url = getFullApiUrl('/api/member/activate');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return { success: true, data: result };
    } catch (err) {
      console.error('Error confirming member activation:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { confirmActivate, loading, error };
}

import { useState, useCallback } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

// Hook to validate guarantor and fetch guarantor details
export function useGuarantorValidate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateGuarantor = useCallback(async (guarantorCode, mode = 4) => {
    setLoading(true);
    setError(null);

    try {
      if (!guarantorCode) {
        throw new Error('Guarantor code is required');
      }

      const response = await fetch(
        getFullApiUrl(`/api/guarantor/validate?guarantorCode=${guarantorCode}&mode=${mode}`),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();

      // Payload structure: { status, data: { guarantorCode, fullName, accountName, balance, guarantorAmount, canGuarantee, message } }
      // For mode=3 (collateral): { status, data: { guarantorCode, balance, canGuarantee, message } }
      if (!payload || typeof payload !== 'object') {
        setError('Invalid response structure');
        return null;
      }

      if (payload.status !== 'success') {
        setError(payload.data?.message || 'Validation failed');
        return null;
      }

      setError(null);
      return payload.data;
    } catch (err) {
      console.error('Error validating guarantor:', err);
      setError(err.message || 'Failed to validate guarantor');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { validateGuarantor, loading, error };
}

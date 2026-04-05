import { useCallback, useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export const useGetBanks = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBanks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl('/api/banks');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Map response to dropdown format
      const banks = Array.isArray(data) 
        ? data
            .map((bank) => ({
              id: bank.BankId || bank.bankId || bank.id,
              name: (bank.BankName || bank.bankName || bank.name || '').trim(),
            }))
            .filter((bank) => bank.name) // Remove empty entries
        : [];

      return { success: true, data: banks };
    } catch (err) {
      console.error('Failed to fetch banks:', err);
      const errorMessage = err.message || 'Failed to fetch banks.';
      setError(errorMessage);

      return { success: false, error: errorMessage, data: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchBanks,
    isLoading,
    error,
  };
};

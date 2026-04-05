import { useCallback, useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export const useGetBankAccounts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBankAccounts = useCallback(async (bankId) => {
    if (!bankId) {
      setError('Bank ID is required');
      return { success: false, error: 'Bank ID is required', data: [] };
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl(`/api/banks/${bankId}/accounts`);
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
      const accounts = Array.isArray(data)
        ? data
            .map((account) => ({
              id: account.AccountNumber || account.accountNumber || account.id,
              name: (account.AccountName || account.accountName || account.name || '').trim(),
            }))
            .filter((account) => account.name) // Remove empty entries
        : [];

      return { success: true, data: accounts };
    } catch (err) {
      console.error('Failed to fetch bank accounts:', err);
      const errorMessage = err.message || 'Failed to fetch bank accounts.';
      setError(errorMessage);

      return { success: false, error: errorMessage, data: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchBankAccounts,
    isLoading,
    error,
  };
};

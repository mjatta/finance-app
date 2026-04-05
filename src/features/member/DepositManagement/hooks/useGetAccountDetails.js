import { useCallback, useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export const useGetAccountDetails = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccountDetails = useCallback(async (accountNumber) => {
    if (!accountNumber || !accountNumber.trim()) {
      setError('Account number is required');
      return { success: false, error: 'Account number is required', data: null };
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl(`/api/account/details/${accountNumber.trim()}`);
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

      // Map response to component field names
      const mappedData = {
        accountNumber: data.AccountNumber || '',
        accountBalance: data.BookBalance || 0,
        clearedBalance: data.ClearedBalance || 0,
        unclearedBalance: data.UnclearedBalance || 0,
      };

      return { success: true, data: mappedData };
    } catch (err) {
      console.error('Failed to fetch account details:', err);
      const errorMessage = err.message || 'Failed to fetch account details.';
      setError(errorMessage);

      return { success: false, error: errorMessage, data: null };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchAccountDetails,
    isLoading,
    error,
  };
};

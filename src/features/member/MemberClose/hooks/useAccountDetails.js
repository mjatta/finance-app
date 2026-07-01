import { useState, useCallback } from 'react';

/**
 * Custom hook to fetch account details from the backend API
 * @param {string} accountNumber - The account number to fetch details for
 * @returns {object} - { accountData, isLoading, error, fetchAccountDetails }
 */
export const useAccountDetails = () => {
  const [accountData, setAccountData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccountDetails = useCallback(async (accountNumber) => {
    if (!accountNumber?.trim()) {
      setError('Please provide an account number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAccountData(null);

    try {
      const response = await fetch(`/api/account/details/${accountNumber.trim()}`);

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? 'Account number not found'
            : `Failed to fetch account details (${response.status})`
        );
      }

      const data = await response.json();

      // Validate response has expected fields
      if (data && typeof data === 'object') {
        // Map API payload to component format
        setAccountData({
          accountNumber: data.AccountNumber || accountNumber.trim(),
          accountName: `${data.ProductId ? `Product ${data.ProductId}` : 'Account'} - Cust ${data.CustCode || ''}`,
          accountBalance: data.BookBalance
            ? parseFloat(data.BookBalance).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : '0.00',
          // Additional fields for reference
          custCode: data.CustCode,
          productId: data.ProductId,
          controlAccount: data.ControlAccount,
          clearedBalance: data.ClearedBalance,
          unclearedBalance: data.UnclearedBalance,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load account details';
      setError(errorMessage);
      setAccountData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    accountData,
    isLoading,
    error,
    fetchAccountDetails,
  };
};

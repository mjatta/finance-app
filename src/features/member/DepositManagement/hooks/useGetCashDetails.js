import { useCallback, useState } from 'react';

export const useGetCashDetails = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCashDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
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
        cashAccount: data.CashAccount || '',
        creditLimit: data.CreditLimit || '',
        debitLimit: data.DebitLimit || '',
        loanLimit: data.LoanLimit || '',
      };

      return { success: true, data: mappedData };
    } catch (err) {
      console.error('Failed to fetch cash details:', err);
      const errorMessage = err.message || 'Failed to fetch cash details.';
      setError(errorMessage);

      return { success: false, error: errorMessage, data: null };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchCashDetails,
    isLoading,
    error,
  };
};

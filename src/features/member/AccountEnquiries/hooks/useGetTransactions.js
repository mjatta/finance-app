import { useState, useCallback } from 'react';

// Hook to fetch transactions by account number
export function useGetTransactions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async (accountNumber) => {
    if (!accountNumber || !accountNumber.trim()) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/transaction/${accountNumber.trim()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle 404 errors - transactions not found
      if (response.status === 404) {
        console.warn(`Transactions not found for account: ${accountNumber}`);
        setError('No transactions found');
        return null;
      }

      // Handle other HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      // Attempt to parse JSON response
      let payload;
      try {
        payload = await response.json();
      } catch (jsonError) {
        console.warn('Failed to parse transactions response as JSON:', jsonError);
        setError('Invalid response format');
        return null;
      }

      // Validate response structure
      if (!payload || typeof payload !== 'object') {
        console.warn('Transactions response is not an object:', payload);
        setError('Invalid response structure');
        return null;
      }

      setError(null);
      return payload;
    } catch (err) {
      // Handle network errors and other exceptions
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.error('Network error or CORS issue fetching transactions:', err);
      } else {
        console.error('Error fetching transactions:', err);
      }
      setError(err.message || 'Failed to fetch transactions');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchTransactions, loading, error };
}

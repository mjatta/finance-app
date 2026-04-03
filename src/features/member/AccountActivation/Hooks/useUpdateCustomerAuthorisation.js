import { useCallback, useState } from 'react';

export const useUpdateCustomerAuthorisation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateAuthorisation = useCallback(async (customerCode) => {
    if (!customerCode || !customerCode.trim()) {
      setError('Customer code is required');
      return { success: false, error: 'Customer code is required' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        customerCode: customerCode.trim(),
      };

      const response = await fetch(
        '/api/update-customer-authorisation',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return { success: true, data };
    } catch (err) {
      console.error('Failed to update customer authorisation:', err);
      const errorMessage = err.message || 'Failed to update customer authorisation.';
      setError(errorMessage);

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    updateAuthorisation,
    isLoading,
    error,
  };
};

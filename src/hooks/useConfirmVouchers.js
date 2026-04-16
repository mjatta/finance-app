import { useState, useCallback } from 'react';

/**
 * Custom hook for confirming verification vouchers
 * Calls POST /api/verification/confirm-vouchers endpoint
 */
export const useConfirmVouchers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const confirmVouchers = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verification/confirm-vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to confirm vouchers: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Failed to confirm vouchers';
      setError(errorMsg);
      console.error('Error confirming vouchers:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { confirmVouchers, loading, error };
};

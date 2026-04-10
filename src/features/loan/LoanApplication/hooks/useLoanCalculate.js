import { useState } from 'react';

export function useLoanCalculate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateLoan = async (payload) => {
    if (!payload) {
      setError('Payload is required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/loans/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch {
        setError('Invalid response format');
        return null;
      }

      console.log('Loan calculation response:', result);
      return result;
    } catch (err) {
      console.error('Error calculating loan:', err);
      setError(err.message || 'Failed to calculate loan');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { calculateLoan, loading, error };
}

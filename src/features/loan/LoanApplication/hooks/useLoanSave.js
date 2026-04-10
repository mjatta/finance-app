import { useState } from 'react';

export const useLoanSave = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveLoan = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/Cusystem/LoanApplication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to save loan application';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  return { saveLoan, loading, error };
};

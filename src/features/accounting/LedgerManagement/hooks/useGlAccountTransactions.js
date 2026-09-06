import { useState } from 'react';

export default function useGlAccountTransactions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccountTransactions = async (accountNumber, companyId = 30) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/glmanagement/account-transactions?companyId=${companyId}&accountNumber=${accountNumber}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to fetch account transactions:', err);
      setError(err.message || 'Failed to load transactions');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchAccountTransactions, loading, error };
}

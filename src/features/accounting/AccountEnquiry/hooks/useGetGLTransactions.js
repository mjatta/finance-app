import { useState } from 'react';

/**
 * Custom hook to fetch GL transactions for a given account number.
 * @returns {Object} { transactions, loading, error, fetchGLTransactions }
 */
export function useGetGLTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch GL transactions for the provided account number.
   * @param {string} accountNumber
   */
  const fetchGLTransactions = async (accountNumber) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/GLTransactions/transactions/${encodeURIComponent(accountNumber)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to fetch GL transactions');
      const data = await resp.json();
      setTransactions(data);
    } catch (err) {
      setError(err.message || 'Unknown error');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  return { transactions, loading, error, fetchGLTransactions };
}

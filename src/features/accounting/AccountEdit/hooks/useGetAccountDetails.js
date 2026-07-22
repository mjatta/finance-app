import { useState } from 'react';

/**
 * Custom hook to fetch account details by account number.
 * @returns {Object} { accountDetails, loading, error, fetchAccountDetails }
 */
export function useGetAccountDetails() {
  const [accountDetails, setAccountDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch account details for the provided account number.
   * @param {string} accountNumber
   */
  const fetchAccountDetails = async (accountNumber) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/accounts/details/${encodeURIComponent(accountNumber)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to fetch account details');
      const data = await resp.json();
      
      // Handle both direct data and nested response formats
      const details = data.data || data;
      setAccountDetails(details);
      return details;
    } catch (err) {
      setError(err.message || 'Unknown error');
      setAccountDetails(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { accountDetails, loading, error, fetchAccountDetails };
}

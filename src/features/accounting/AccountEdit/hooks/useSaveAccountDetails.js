import { useState } from 'react';

/**
 * Custom hook to save account details.
 * @returns {Object} { loading, error, saveAccountDetails }
 */
export function useSaveAccountDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Save account details.
   * @param {string} accountNumber
   * @param {string} accountName
   */
  const saveAccountDetails = async (accountNumber, accountName) => {
    setLoading(true);
    setError(null);
    try {
      const url = '/api/accounts/update-name';
      const payload = {
        AccountNo: accountNumber,
        AccountName: accountName,
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) throw new Error('Failed to save account details');
      const data = await resp.json();

      // Handle both direct data and nested response formats
      const result = data.data || data;
      return result;
    } catch (err) {
      setError(err.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, saveAccountDetails };
}

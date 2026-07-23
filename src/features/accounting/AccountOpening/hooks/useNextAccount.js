import { useState } from 'react';

/**
 * Custom hook to fetch the next available account item/number for a given sub head (subgroup).
 * Calls /api/accounts/nextaccount/:subgrpcode
 * Sample payload: { "AccountItem": "001331", "AccountNumber": "15000133101", "Exists": true }
 * @returns {Object} { loading, error, fetchNextAccount }
 */
export function useNextAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNextAccount = async (subgrpcode) => {
    if (!subgrpcode) return null;

    setLoading(true);
    setError(null);
    try {
      const url = `/api/accounts/nextaccount/${encodeURIComponent(subgrpcode)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to fetch next account');
      const data = await resp.json();
      return data;
    } catch (err) {
      setError(err.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, fetchNextAccount };
}

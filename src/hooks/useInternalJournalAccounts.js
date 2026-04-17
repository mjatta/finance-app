import { useState, useEffect } from 'react';

/**
 * Fetches internal journal accounts for company 30
 * GET /api/Internaljournalaccounts/internal/30
 */
export const useInternalJournalAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/Internaljournalaccounts/internal/30');
        if (!res.ok) throw new Error(`Failed to fetch accounts: ${res.statusText}`);
        const data = await res.json();
        setAccounts(Array.isArray(data) ? data : data.accounts || data.data || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching internal journal accounts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  return { accounts, loading, error };
};

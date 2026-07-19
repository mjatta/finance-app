import { useState, useEffect } from 'react';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/endofyear/accounts');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        // Expecting array of objects with AccountNo and AccountName
        if (Array.isArray(data)) {
          if (mounted) setAccounts(data);
        } else if (Array.isArray(data?.Accounts)) {
          if (mounted) setAccounts(data.Accounts);
        } else {
          if (mounted) setAccounts([]);
        }
      } catch (err) {
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false };
  }, []);

  return { accounts, loading, error };
};

export default useAccounts;

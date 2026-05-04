import { useEffect, useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

const normalizeAccount = (account, index) => {
  const accountNumber = (
    account?.cacctnumb
    ?? account?.AccountNumber
    ?? account?.accountNumber
    ?? account?.id
    ?? `${index}`
  ).toString().trim();

  const accountName = (
    account?.displayName
    ?? account?.cacctname
    ?? account?.AccountName
    ?? account?.accountName
    ?? account?.name
    ?? ''
  ).toString().trim();

  const displayName = accountName || accountNumber;

  return {
    cacctnumb: accountNumber,
    displayName,
  };
};

export const useGetInternalJournalAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchAccounts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(getFullApiUrl('/api/Internaljournalaccounts/internal/30'));
        if (!response.ok) {
          throw new Error(`Failed to fetch accounts: ${response.status}`);
        }

        const payload = await response.json();
        const source = Array.isArray(payload) ? payload : payload?.accounts || payload?.data || [];
        const normalized = source.map(normalizeAccount).filter((item) => item.cacctnumb);

        if (mounted) {
          setAccounts(normalized);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load internal journal accounts.');
          setAccounts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAccounts();

    return () => {
      mounted = false;
    };
  }, []);

  return { accounts, loading, error };
};

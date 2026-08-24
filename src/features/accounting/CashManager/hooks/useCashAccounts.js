import { useEffect, useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

const normalizeAccount = (item) => {
  const accountNumber = (
    item?.cacctnumb
    ?? item?.CACCTNUMB
    ?? item?.cAcctNumb
    ?? item?.CashAccount
    ?? item?.cashAccount
    ?? item?.accountNumber
    ?? ''
  ).toString().trim();
  const accountName = (
    item?.cacctname
    ?? item?.CACCTNAME
    ?? item?.cAcctName
    ?? item?.accountName
    ?? ''
  ).toString().trim();
  return { accountNumber, accountName };
};

const extractRawAccounts = (payload) => {
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.CashAccounts,
    payload?.cashAccounts,
    payload?.accounts,
    payload?.data?.CashAccounts,
    payload?.data?.cashAccounts,
    payload?.data?.accounts,
  ];

  const match = candidates.find((entry) => Array.isArray(entry));
  return Array.isArray(match) ? match : [];
};

/**
 * Fetches cash (GL) accounts available for Cash Manager processing.
 * GET /api/setup/GetBasicDetails
 */
export function useCashAccounts() {
  const [cashAccounts, setCashAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCashAccounts = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = getFullApiUrl('/api/setup/GetBasicDetails');
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch cash accounts (${response.status})`);
        }

        const payload = await response.json();
        const rawAccounts = extractRawAccounts(payload);
        const normalized = rawAccounts
          .map(normalizeAccount)
          .filter((item) => item.accountNumber);

        const uniqueByNumber = Array.from(
          new Map(normalized.map((item) => [item.accountNumber, item])).values(),
        );

        if (isMounted) {
          setCashAccounts(uniqueByNumber);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load cash accounts');
          setCashAccounts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCashAccounts();

    return () => {
      isMounted = false;
    };
  }, []);

  return { cashAccounts, loading, error };
}

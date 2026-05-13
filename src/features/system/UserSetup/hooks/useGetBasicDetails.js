import { useEffect, useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

const normalizeAccount = (item) => {
  const cacctnumb = (
    item?.cacctnumb
    ?? item?.CACCTNUMB
    ?? item?.cAcctNumb
    ?? item?.CashAccount
    ?? item?.cashAccount
    ?? item?.accountNumber
    ?? ''
  ).toString().trim();
  const cacctname = (
    item?.cacctname
    ?? item?.CACCTNAME
    ?? item?.cAcctName
    ?? item?.accountName
    ?? ''
  ).toString().trim();
  return { cacctnumb, cacctname };
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

export function useGetBasicDetails() {
  const [cashAccounts, setCashAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBasicDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = getFullApiUrl('/api/setup/GetBasicDetails');
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch basic details (${response.status})`);
        }

        const payload = await response.json();
        const rawAccounts = extractRawAccounts(payload);
        const normalized = rawAccounts
          .map(normalizeAccount)
          .filter((item) => item.cacctnumb);

        const uniqueByNumber = Array.from(
          new Map(normalized.map((item) => [item.cacctnumb, item])).values(),
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

    fetchBasicDetails();

    return () => {
      isMounted = false;
    };
  }, []);

  return { cashAccounts, loading, error };
}

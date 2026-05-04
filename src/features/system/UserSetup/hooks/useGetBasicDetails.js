import { useEffect, useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

const normalizeAccount = (item) => {
  const cacctnumb = (item?.cacctnumb || '').toString().trim();
  const cacctname = (item?.cacctname || '').toString().trim();
  return { cacctnumb, cacctname };
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
        const rawAccounts = Array.isArray(payload?.CashAccounts) ? payload.CashAccounts : [];
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

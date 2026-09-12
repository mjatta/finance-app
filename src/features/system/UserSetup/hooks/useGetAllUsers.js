import { useEffect, useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useGetAllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl('/api/auth/GetAllUsers');
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users (${response.status})`);
      }

      const payload = await response.json();
      const rawUsers = Array.isArray(payload?.Data) ? payload.Data : [];

      const normalized = rawUsers.map((item) => ({
        UserID: (item?.UserID || '').toString().trim(),
        UserName: (item?.UserName || '').toString().trim(),
        StaffNo: (item?.StaffNo || '').toString().trim(),
        AccessLevel: item?.AccessLevel ?? '',
        CashAccount: (item?.CashAccount || '').toString().trim(),
        Role: (item?.Role || '').toString().trim(),
        Features: (item?.Features || '').toString().trim(),
        Email: (item?.Email || '').toString().trim(),
        Phone: (item?.Phone || '').toString().trim(),
        FeaturePermissions: item?.FeaturePermissions && typeof item.FeaturePermissions === 'object' ? item.FeaturePermissions : {},
        PagePermissions: item?.PagePermissions && typeof item.PagePermissions === 'object' ? item.PagePermissions : {},
        CreditLimit: item?.CreditLimit ?? '',
        DebitLimit: item?.DebitLimit ?? '',
        LoanLimit: item?.LoanLimit ?? '',
        IsCashier: Boolean(item?.IsCashier),
        CompId: item?.CompId,
        BranchId: item?.BranchId,
        Region: item?.Region,
      }));

      setUsers(normalized);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      fetchAllUsers();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return { users, loading, error, refetch: fetchAllUsers };
}

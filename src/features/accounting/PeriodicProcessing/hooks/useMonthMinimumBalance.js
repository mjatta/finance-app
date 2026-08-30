import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook for GET /api/interest-calculation/minimum-balance/month?companyId=&year=&month=&account=
 */
export function useMonthMinimumBalance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getMonthMinimumBalance = async ({ companyId = 30, year, month, account }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        companyId: String(companyId),
        year: String(year),
        month: String(month),
        account: String(account),
      });
      const url = getFullApiUrl(`/api/interest-calculation/minimum-balance/month?${params.toString()}`);
      const res = await fetch(url);

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        throw new Error(payload?.Message || payload?.message || `Failed to fetch month data for account ${account} (status ${res.status})`);
      }

      return { success: true, data: payload };
    } catch (err) {
      const message = err.message || `Failed to fetch month minimum balance for account ${account}`;
      setError(message);
      return { success: false, errorMessage: message };
    } finally {
      setLoading(false);
    }
  };

  return { getMonthMinimumBalance, loading, error };
}

import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook for GET /api/interest-calculation/minimum-balance/last-year?companyId=&year=&account=
 */
export function useLastYearMinimumBalance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLastYearMinimumBalance = async ({ companyId = 30, year, account }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        companyId: String(companyId),
        year: String(year),
        account: String(account),
      });
      const url = getFullApiUrl(`/api/interest-calculation/minimum-balance/last-year?${params.toString()}`);
      const res = await fetch(url);

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        throw new Error(payload?.Message || payload?.message || `Failed to fetch last year data for account ${account} (status ${res.status})`);
      }

      return { success: true, data: payload };
    } catch (err) {
      const message = err.message || `Failed to fetch last year minimum balance for account ${account}`;
      setError(message);
      return { success: false, errorMessage: message };
    } finally {
      setLoading(false);
    }
  };

  return { getLastYearMinimumBalance, loading, error };
}

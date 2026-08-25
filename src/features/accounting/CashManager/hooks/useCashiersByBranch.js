import { useState, useCallback } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook to fetch cashiers for a specific branch
 */
export function useCashiersByBranch() {
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCashiersByBranch = useCallback(async (branchId, companyId = 30) => {
    if (!branchId) {
      setCashiers([]);
      setError(null);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl(`/api/CashManager/cashiers?companyId=${companyId}&branchId=${branchId}`);
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch cashiers (status ${response.status})`);
      }

      const data = await response.json();

      // Map API response to grid row format
      const mappedCashiers = Array.isArray(data)
        ? data.map((cashier, index) => ({
            id: `${cashier.cacctnumb}-${cashier.username}-${index}`, // Create unique ID combining account + username + index
            cashier: cashier.username || '',
            accountNumber: cashier.cacctnumb || '',
            accountName: cashier.cacctname || '',
            currentBalance: parseFloat(cashier.nbookbal) || 0,
            tillAmount: parseFloat(cashier.tillamt) || 0,
            endBalance: parseFloat(cashier.endbal) || 0,
          }))
        : [];

      setCashiers(mappedCashiers);
      setError(null);
      return mappedCashiers;
    } catch (err) {
      console.error('Error fetching cashiers by branch:', err);
      setError(err.message || 'Failed to fetch cashiers');
      setCashiers([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { cashiers, loading, error, fetchCashiersByBranch };
}

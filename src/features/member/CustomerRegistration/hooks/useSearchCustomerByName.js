import { useCallback, useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook to search customers by full name (3+ characters)
 * Returns array of matching customers
 */
export const useSearchCustomerByName = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchCustomers = useCallback(async (searchValue) => {
    if (!searchValue || searchValue.trim().length < 1) {
      return { success: true, data: [] };
    }

    setLoading(true);
    setError(null);

    try {
      const url = getFullApiUrl(`/api/getmemberdetails?search=${encodeURIComponent(String(searchValue).trim())}`);
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      // Handle different response shapes
      let results = [];
      if (Array.isArray(data)) {
        results = data;
      } else if (Array.isArray(data?.data)) {
        results = data.data;
      } else if (data?.data) {
        results = [data.data];
      } else if (data) {
        results = [data];
      }

      return { success: true, data: results };
    } catch (err) {
      setError(err.message || 'Failed to search customers');
      return { success: false, error: err.message || 'Failed to search customers', data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchCustomers, loading, error };
};

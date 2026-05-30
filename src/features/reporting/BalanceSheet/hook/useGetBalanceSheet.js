import { useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { getApiUrl } from '../../../../utils/apiConfig';

export const useGetBalanceSheet = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  const fetchBalanceSheet = async (branchId, atDate) => {
    setLoading(true);
    setError(null);

    try {
      const companyId = user?.CompId || 30;
      const payload = {
        CompanyID: companyId,
        BranchID: Number(branchId) || 0,
        AtDate: atDate || new Date().toISOString().slice(0, 10),
      };

      const url = getApiUrl('balance-sheet');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch balance sheet: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      const errorMsg = err.message || 'Unknown error';
      setError(errorMsg);
      setLoading(false);
      return null;
    }
  };

  return { fetchBalanceSheet, loading, error };
};

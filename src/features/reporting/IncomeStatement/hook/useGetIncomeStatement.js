import { useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import { getApiUrl } from '../../../../utils/apiConfig';

export const useGetIncomeStatement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  const fetchIncomeStatement = async (atDate) => {
    setLoading(true);
    setError(null);

    try {
      const companyId = user?.CompId || 30;

      const payload = {
        CompanyID: companyId,
        BranchID: 0,
        AtDate: atDate || new Date().toISOString().slice(0, 10),
      };

      const url = getApiUrl('income-statement');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch income statement: ${response.status} ${response.statusText} - ${errorText}`);
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

  return { fetchIncomeStatement, loading, error };
};

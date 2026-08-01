import { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { getApiUrl } from '../../../utils/apiConfig';

export const useGetTrialBalance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  const fetchTrialBalance = async (branchId, date) => {
    setLoading(true);
    setError(null);

    try {
      // Get CompanyID from user data
      const companyId = user?.CompId || 30;

      // Send date-only string in YYYY-MM-DD format
      const formattedDate = date || new Date().toISOString().slice(0, 10);

      const payload = {
        CompanyID: companyId,
        BranchID: Number(branchId) || 0,
        ToDate: formattedDate,
      };

      const url = getApiUrl('trial-balance');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch trial balance: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      const errorMsg = err.message;
      setError(errorMsg);
      setLoading(false);
      console.error('Error fetching trial balance:', errorMsg);
      return null;
    }
  };

  return { fetchTrialBalance, loading, error };
};

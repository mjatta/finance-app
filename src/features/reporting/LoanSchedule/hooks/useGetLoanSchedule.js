import { useState } from 'react';
import { getApiUrl } from '../../../../utils/apiConfig';

export const useGetLoanSchedule = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoanSchedule = async (customerCode, accountNumber) => {
    if (!customerCode || !String(customerCode).trim() || !accountNumber || !String(accountNumber).trim()) {
      setError('Customer code and account number are required.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        CustomerCode: String(customerCode).trim(),
        AccountNumber: String(accountNumber).trim(),
      };

      const response = await fetch(getApiUrl('loan-schedule'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch loan schedule: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err?.message || 'Failed to fetch loan schedule.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchLoanSchedule, loading, error };
};

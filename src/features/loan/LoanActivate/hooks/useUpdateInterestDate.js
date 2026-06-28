import { useCallback } from 'react';
import dayjs from 'dayjs';

export const useUpdateInterestDate = () => {
  const updateInterestDate = useCallback(async (accountNumber) => {
    if (!accountNumber) {
      throw new Error('Account number is required');
    }

    const transactionDate = dayjs().format('YYYY-MM-DD');

    const response = await fetch('/api/loans/update-interest-date', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountNumber,
        transactionDate,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update interest date: ${response.status}`);
    }

    return response;
  }, []);

  return { updateInterestDate };
};

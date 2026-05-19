import { useState } from 'react';
import { getApiUrl } from '../../../../utils/apiConfig';

export default function useGetLoanBalancePrint() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoanBalance = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl('loan-balance-print'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch loan balance: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      return data;
    } catch (err) {
      const message = err?.message || 'Failed to fetch loan balance.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchLoanBalance, loading, error };
}
import { useState } from 'react';
import { buildApiUrl } from '../../../../utils/apiConfig';

export default function useGetLoanProvisionSummary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = async ({ toDate, productId }) => {
    setLoading(true);
    setError(null);

    try {
      const url = buildApiUrl('loan-provision-summary', {
        ToDate: toDate,
        ProductID: productId,
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      return { success: true, data };
    } catch (err) {
      const message = err?.message || 'Failed to fetch loan provision summary.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { fetchSummary, loading, error };
}
import { useState } from 'react';
import { buildApiUrl } from '../../../../utils/apiConfig';

export default function useGetLoanProvisionDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = async ({ toDate, productId, categoryId = 0 }) => {
    setLoading(true);
    setError(null);

    try {
      const url = buildApiUrl('loan-provision-details', {
        ToDate: toDate,
        ProductID: productId,
        Category: categoryId,
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
      const message = err?.message || 'Failed to fetch loan provision details.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { fetchDetails, loading, error };
}
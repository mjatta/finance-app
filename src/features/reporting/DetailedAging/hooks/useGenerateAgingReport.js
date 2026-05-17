import { useState } from 'react';
import { getApiUrl } from '../../../../utils/apiConfig';

export default function useGenerateAgingReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateReport = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(getApiUrl('aging-report'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      const message = err?.message || 'Failed to generate report.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { generateReport, loading, error };
}
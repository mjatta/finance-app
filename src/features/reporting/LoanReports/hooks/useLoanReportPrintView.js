import { useCallback, useState } from 'react';

export const useLoanReportPrintView = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateReport = useCallback(async (payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/loan-report/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      // Normalize: backend may return { rows } or array
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.rows)) return data.rows;
      if (Array.isArray(data.data)) return data.data;
      return [];
    } catch (err) {
      setError(err?.message || 'Failed to generate report');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generateReport, isLoading, error };
};

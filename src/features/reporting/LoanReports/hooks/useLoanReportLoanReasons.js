import { useCallback, useState } from 'react';

export const useLoanReportLoanReasons = () => {
  const [loanReasons, setLoanReasons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoanReasons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/loan-report/loan-reasons');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const payload = await resp.json();
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.data) ? payload.data : [];
      const mapped = items
        .map((it) => ({ id: it?.res_id ?? it?.id, name: (it?.res_name || it?.resName || it?.name || '').toString().trim() }))
        .filter((it) => it.id !== undefined && it.name);
      setLoanReasons(mapped);
    } catch (err) {
      setError(err?.message || 'Failed to load loan reasons');
      setLoanReasons([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { loanReasons, isLoading, error, fetchLoanReasons };
};

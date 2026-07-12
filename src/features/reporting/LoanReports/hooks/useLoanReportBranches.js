import { useCallback, useState } from 'react';

export const useLoanReportBranches = () => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/loan-report/branches');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const payload = await resp.json();
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.data) ? payload.data : [];
      const mapped = items
        .map((it) => ({ id: it?.branchid ?? it?.id, name: (it?.br_name || it?.brName || it?.name || '').toString().trim() }))
        .filter((it) => it.id !== undefined && it.name);
      setBranches(mapped);
    } catch (err) {
      setError(err?.message || 'Failed to load branches');
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { branches, isLoading, error, fetchBranches };
};

import { useCallback, useState } from 'react';

export const useLoanReportCurrencies = () => {
  const [currencies, setCurrencies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCurrencies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/loan-report/currencies');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const payload = await resp.json();
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.data) ? payload.data : [];
      const mapped = items
        .map((it) => ({ id: it?.curr_code ?? it?.id, name: (it?.curr_name || it?.currName || it?.name || '').toString().trim() }))
        .filter((it) => it.id !== undefined && it.name);
      setCurrencies(mapped);
    } catch (err) {
      setError(err?.message || 'Failed to load currencies');
      setCurrencies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { currencies, isLoading, error, fetchCurrencies };
};

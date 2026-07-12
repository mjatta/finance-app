import { useCallback, useState } from 'react';

export const useLoanReportProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/loan-report/products');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const payload = await resp.json();
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.data) ? payload.data : [];
      const mapped = items
        .map((it) => ({ id: it?.prd_id ?? it?.id, name: (it?.prd_name || it?.prdName || it?.name || '').toString().trim() }))
        .filter((it) => it.id !== undefined && it.name);
      setProducts(mapped);
    } catch (err) {
      setError(err?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { products, isLoading, error, fetchProducts };
};

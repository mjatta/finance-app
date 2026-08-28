import { useState, useEffect } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useInterestCalculationProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async (companyId = 30) => {
    setLoading(true);
    setError(null);
    try {
      const url = getFullApiUrl(`/api/interest-calculation/products/${companyId}`);
      const res = await fetch(url);
      let payload = null;
      try {
        payload = await res.json();
      } catch (jsonErr) {
        console.error('Failed to parse interest calculation products JSON:', jsonErr);
        payload = null;
      }
      if (!res.ok) {
        setError((payload && payload.message) || `Failed to fetch products (status ${res.status})`);
        setProducts([]);
        return;
      }

      const data = Array.isArray(payload?.data) ? payload.data : [];

      // Exclude LOANS products - this grid is for Savings Interest products only
      const mapped = data
        .filter((item) => String(item.MainCategory || '').trim().toUpperCase() !== 'LOANS')
        .map((item, index) => ({
          id: item.ProductId ?? index,
          category: item.MainCategory ? String(item.MainCategory).trim() : '',
          productName: item.ProductName ? String(item.ProductName).replace(/\r\n/g, ' ').trim() : '',
          interestRate: item.InterestRate != null ? `${item.InterestRate}%` : '',
          interestScope: item.InterestScore || '',
          calculationMethod: item.InterestMethod || '',
          mandate: item.ProductMandatory || '',
        }));

      setProducts(mapped);
    } catch (err) {
      setError(err.message || 'Unknown error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const refresh = () => {
    fetchProducts();
  };

  return { products, loading, error, refresh };
}

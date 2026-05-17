import { useState, useEffect } from 'react';
import { getApiUrl } from '../../../../utils/apiConfig';

const normalizeProductLabel = (product) =>
  (
    product?.prd_name ||
    product?.productName ||
    product?.name ||
    product?.label ||
    ''
  ).toString().trim();

export default function useGetAgingProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(getApiUrl('aging-products'));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const result = await response.json();
        const raw =
          result?.status === 'success' && Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result)
              ? result
              : [];

        const options = raw
          .map((item) => ({
            value: String(item?.prd_id ?? item?.id ?? normalizeProductLabel(item)).trim(),
            label: normalizeProductLabel(item),
          }))
          .filter((item) => item.value && item.label);

        setProducts(options);
      } catch (err) {
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}

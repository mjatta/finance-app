import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch products list.
 * @returns {Object} { products, loading, error }
 */
export function useGetMemberAccountProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = '/api/member-account/products/30';
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Failed to fetch products');
        const data = await resp.json();

        // Handle both array and nested response formats
        const productList = Array.isArray(data) ? data : (data.data || data.products || []);
        setProducts(productList);
      } catch (err) {
        setError(err.message || 'Unknown error');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}

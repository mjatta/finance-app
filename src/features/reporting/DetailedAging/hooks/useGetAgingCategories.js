import { useState, useEffect } from 'react';
import { getApiUrl } from '../../../../utils/apiConfig';

export default function useGetAgingCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = getApiUrl('aging-categories');
      const separator = baseUrl.includes('?') ? '&' : '?';
      const cacheBustedUrl = `${baseUrl}${separator}_ts=${Date.now()}`;

      const response = await fetch(cacheBustedUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      const raw = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      const options = raw
        .map((item, index) => ({
          value: String(item?.Category ?? item?.category ?? item?.Id ?? item?.id ?? index + 1),
          label: String(item?.LoanAgeCategory ?? '').trim(),
        }))
        .filter((item) => item.value && item.label);

      setCategories(options);
    } catch (err) {
      setError(err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, error, refetchCategories: fetchCategories };
}

import { useState, useEffect } from 'react';
import { getApiUrl } from '../../../../utils/apiConfig';

export default function useGetAgingCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(getApiUrl('aging-categories'));
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

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

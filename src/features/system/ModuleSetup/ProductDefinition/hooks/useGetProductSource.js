import { useEffect, useState } from 'react';

const getProductSourceLabel = (item) => {
  const candidates = [
    item?.prd_name,
    item?.adescrip,
    item?.cacctname,
    item?.productName,
    item?.productname,
    item?.name,
    item?.label,
    item?.description,
    item?.descrip,
    item?.source,
  ];

  const match = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return match ? match.trim() : '';
};

const getProductSourceValue = (item, fallbackLabel) => {
  const candidates = [
    item?.prd_id,
    item?.acode,
    item?.cacctnumb,
    item?.id,
    item?.code,
    item?.value,
    fallbackLabel,
  ];

  const match = candidates.find((value) => {
    if (typeof value === 'number') {
      return Number.isFinite(value);
    }

    return typeof value === 'string' && value.trim().length > 0;
  });

  if (typeof match === 'number') {
    return String(match);
  }

  return match ? match.trim() : '';
};

export function useGetProductSource() {
  const [productSources, setProductSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadProductSources = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/Setup/productsource');
        if (!response.ok) {
          throw new Error('Failed to fetch product sources');
        }

        const payload = await response.json();
        const rows = Array.isArray(payload) ? payload : [];

        if (!cancelled) {
          setProductSources(
            rows
              .map((item) => {
                const label = getProductSourceLabel(item);
                const value = getProductSourceValue(item, label);
                return { value, label };
              })
              .filter((item) => item.label && item.value),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load product sources');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProductSources();

    return () => {
      cancelled = true;
    };
  }, []);

  return { productSources, loading, error };
}

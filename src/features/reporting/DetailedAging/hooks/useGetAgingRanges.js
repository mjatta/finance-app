import { useState, useEffect } from 'react';
import { getApiUrl } from '../../../../utils/apiConfig';

export default function useGetAgingRanges() {
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRanges = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(getApiUrl('aging-ranges'));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const result = await response.json();
        const raw = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];

        const mapped = raw.map((item, index) => ({
          id: item.id ?? item.rangeId ?? index + 1,
          daysFrom: item.daysFrom ?? item.days_from ?? item.DaysFrom ?? '',
          daysTo: item.daysTo ?? item.days_to ?? item.DaysTo ?? '',
          percentage: item.percentage ?? item.Percentage ?? '',
        }));

        setRanges(mapped);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRanges();
  }, []);

  return { ranges, loading, error };
}

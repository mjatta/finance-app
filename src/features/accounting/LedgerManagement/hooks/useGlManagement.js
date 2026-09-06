import { useState } from 'react';

export default function useGlManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGlData = async (companyId = 30) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/glmanagement/load?companyId=${companyId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to fetch GL data:', err);
      setError(err.message || 'Failed to load GL data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchGlData, loading, error };
}

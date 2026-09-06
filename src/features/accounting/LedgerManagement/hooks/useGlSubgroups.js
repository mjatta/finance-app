import { useState } from 'react';

export default function useGlSubgroups() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSubgroupAccounts = async (subGroupCode) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/glmanagement/subgroups/${subGroupCode}/accounts`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to fetch subgroup accounts:', err);
      setError(err.message || 'Failed to load accounts');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchSubgroupAccounts, loading, error };
}

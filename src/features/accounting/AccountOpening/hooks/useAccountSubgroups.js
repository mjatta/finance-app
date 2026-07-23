import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch sub head (subgroup) list for Account Opening.
 * Calls /api/accounts/subgroups/1
 * Sample payload item: { "subgrpcode": "100", "subgrpname": "Fixed Assets..." }
 * @returns {Object} { subgroups, loading, error }
 */
export function useAccountSubgroups() {
  const [subgroups, setSubgroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubgroups = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = '/api/accounts/subgroups/1';
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Failed to fetch sub heads');
        const data = await resp.json();

        // Handle both array and nested response formats
        let subgroupList = Array.isArray(data) ? data : (data.data || data.subgroups || []);

        // Trim whitespace from subgroup names
        subgroupList = subgroupList.map((subgroup) => ({
          ...subgroup,
          subgrpname: subgroup.subgrpname ? subgroup.subgrpname.trim() : '',
        }));

        setSubgroups(subgroupList);
      } catch (err) {
        setError(err.message || 'Unknown error');
        setSubgroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubgroups();
  }, []);

  return { subgroups, loading, error };
}

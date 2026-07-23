import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch branches list for Account Opening.
 * Calls /api/accounts/branches/30
 * @returns {Object} { branches, loading, error }
 */
export function useAccountBranches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = '/api/accounts/branches/30';
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Failed to fetch branches');
        const data = await resp.json();

        // Handle both array and nested response formats
        let branchList = Array.isArray(data) ? data : (data.data || data.branches || []);

        // Trim whitespace from branch names
        branchList = branchList.map((branch) => ({
          ...branch,
          br_name: branch.br_name ? branch.br_name.trim() : (branch.branchname ? branch.branchname.trim() : ''),
        }));

        setBranches(branchList);
      } catch (err) {
        setError(err.message || 'Unknown error');
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  return { branches, loading, error };
}

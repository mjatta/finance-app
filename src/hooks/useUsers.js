import { useCallback, useState } from 'react';

/**
 * Global hook for fetching users from API
 * Used for dropdown selections across multiple pages
 * @returns {Object} { users, isLoading, error, fetchUsers }
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/list');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle different response formats
      let usersData = [];
      if (Array.isArray(result)) {
        usersData = result;
      } else if (Array.isArray(result?.data)) {
        usersData = result.data;
      } else if (Array.isArray(result?.users)) {
        usersData = result.users;
      } else if (Array.isArray(result?.result)) {
        usersData = result.result;
      }

      // Map response to component format, display oprcode
      const mappedUsers = usersData
        .map((user) => ({
          value: user?.oprcode?.trim() || '',
          label: user?.oprcode?.trim() || '',
        }))
        .filter((user) => user.value && user.label);

      setUsers(mappedUsers);
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch users';
      setError(errorMsg);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    users,
    isLoading,
    error,
    fetchUsers,
  };
};

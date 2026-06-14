import { useEffect, useState } from 'react';

export const useRecoveryWriteOffClients = () => {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadClients = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/loan-recovery-write-off-clients');
        if (!response.ok) {
          throw new Error(`Failed to fetch recovery/write-off clients: ${response.status}`);
        }

        const payload = await response.json();
        const records = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.rows)
            ? payload.rows
            : [];

        if (isMounted) {
          setRows(records);
        }
      } catch (err) {
        if (isMounted) {
          setRows([]);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadClients();

    return () => {
      isMounted = false;
    };
  }, []);

  return { rows, isLoading, error };
};

import { useEffect, useState } from 'react';

export const useRecoveryWriteOffClients = (refreshKey = 0) => {
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
        console.debug('useRecoveryWriteOffClients: fetched', { status: response.status, ok: response.ok });
        if (!response.ok) {
          const text = await response.text().catch(() => null);
          console.debug('useRecoveryWriteOffClients: non-ok response body', { text });
          throw new Error(`Failed to fetch recovery/write-off clients: ${response.status}`);
        }

        const payload = await response.json().catch(async (err) => {
          const txt = await response.text().catch(() => null);
          console.debug('useRecoveryWriteOffClients: invalid json response', { err, text: txt });
          throw err;
        });
        console.debug('useRecoveryWriteOffClients: payload', { type: typeof payload, sample: Array.isArray(payload) ? payload.slice(0,3) : payload?.rows?.slice?.(0,3) });
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
  }, [refreshKey]);

  return { rows, isLoading, error };
};

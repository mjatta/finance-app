import { useEffect, useState } from 'react';

export const useIdTypes = () => {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use /api/remote-id-types to avoid colliding with local api file served as static
        const res = await fetch('/api/remote-id-types', { method: 'GET', headers: { 'Content-Type': 'application/json' } });

        if (res.status === 404) {
          console.warn('Id types endpoint not found (404)');
          if (mounted) setOptions([]);
          return;
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => null);
          throw new Error(`HTTP ${res.status} ${txt || ''}`);
        }

        let payload;
        try {
          payload = await res.json();
        } catch (jsonErr) {
          console.error('Invalid JSON from id-types endpoint', jsonErr);
          throw new Error('Invalid JSON response from id-types endpoint');
        }

        // Normalize payload: allow array or { rows: [] }
        const items = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : [];

        const normalized = items
          .map((it, idx) => ({
            idtype: it?.idtype ?? it?.IdType ?? it?.id ?? idx + 1,
            id_name: (it?.id_name || it?.name || it?.displayName || '').toString(),
          }))
          .filter((it) => it.id_name && it.idtype !== undefined);

        if (mounted) setOptions(normalized);
      } catch (err) {
        console.error('Error loading id types:', err.message || err);
        if (mounted) {
          setOptions([]);
          setError(err.message || String(err));
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { options, isLoading, error };
};

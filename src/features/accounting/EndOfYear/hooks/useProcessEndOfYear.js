import { useState, useCallback } from 'react';

export const useProcessEndOfYear = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const process = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/endofyear/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
      });
      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (e) { data = text; }
      if (!res.ok) throw new Error(JSON.stringify(data) || `Status ${res.status}`);
      return data;
    } catch (err) {
      setError(err.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { process, loading, error };
};

export default useProcessEndOfYear;

import { useEffect, useState } from 'react';

export const useMemberSavings = (memberAccount) => {
  const [savings, setSavings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSavings = async () => {
      if (!memberAccount) {
        setSavings(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/loan/membersavings?memcode=${encodeURIComponent(memberAccount)}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch member savings: ${response.status}`);
        }

        const data = await response.json();
        if (isMounted) {
          setSavings(data);
        }
      } catch (err) {
        if (isMounted) {
          setSavings(null);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSavings();

    return () => {
      isMounted = false;
    };
  }, [memberAccount]);

  return { savings, isLoading, error };
};

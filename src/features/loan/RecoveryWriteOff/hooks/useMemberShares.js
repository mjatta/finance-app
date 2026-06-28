import { useEffect, useState } from 'react';

export const useMemberShares = (memberAccount) => {
  const [shares, setShares] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadShares = async () => {
      if (!memberAccount) {
        setShares(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/loan/membershares?memcode=${encodeURIComponent(memberAccount)}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch member shares: ${response.status}`);
        }

        const data = await response.json();
        if (isMounted) {
          setShares(data);
        }
      } catch (err) {
        if (isMounted) {
          setShares(null);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadShares();

    return () => {
      isMounted = false;
    };
  }, [memberAccount]);

  return { shares, isLoading, error };
};

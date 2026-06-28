import { useEffect, useState } from 'react';

export const useSavingsSharesDetails = (cacctnumb) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadDetails = async () => {
      if (!cacctnumb) {
        setDetails(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/account/details/${encodeURIComponent(cacctnumb)}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch savings/shares details: ${response.status}`);
        }

        const data = await response.json();
        if (isMounted) {
          setDetails(data);
        }
      } catch (err) {
        if (isMounted) {
          setDetails(null);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [cacctnumb]);

  return { details, isLoading, error };
};

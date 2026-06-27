import { useEffect, useState } from 'react';

export const useLoanDetails = (custCode, loanId) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!custCode || !loanId) {
      setDetails(null);
      setError(null);
      return;
    }

    let isMounted = true;

    const loadDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const url = `/api/loan-details?ncompid=30&memcode=${encodeURIComponent(custCode)}&tnloanid=${encodeURIComponent(loanId)}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch loan details: ${response.status}`);
        }

        const payload = await response.json();
        if (isMounted) {
          setDetails(payload);
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
  }, [custCode, loanId]);

  return { details, isLoading, error };
};

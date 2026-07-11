import { useEffect, useState } from 'react';

export const useBadDebtExpenses = (loanId) => {
  const [badDebtExpenses, setBadDebtExpenses] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadBadDebtExpenses = async () => {
      if (!loanId) {
        setBadDebtExpenses(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/loans/accounts?loanId=${encodeURIComponent(loanId)}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch bad debt expenses: ${response.status}`);
        }

        const data = await response.json();
        if (isMounted) {
          setBadDebtExpenses(data);
        }
      } catch (err) {
        if (isMounted) {
          setBadDebtExpenses(null);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBadDebtExpenses();

    return () => {
      isMounted = false;
    };
  }, [loanId]);

  return { badDebtExpenses, isLoading, error };
};

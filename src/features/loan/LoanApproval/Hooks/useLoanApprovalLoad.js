import { useState, useCallback } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

// Hook to fetch loans for approval on page load
export function useLoanApprovalLoad() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoansForApproval = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getFullApiUrl('/api/LoanApproval/getClientLoansForApproval?ncompid=30'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();

      // Expected structure: { status, data: [ { ...loanData } ] }
      if (!payload || typeof payload !== 'object') {
        setError('Invalid response structure');
        return null;
      }

      if (payload.status !== 'success') {
        setError(payload.message || 'Failed to fetch loans');
        return null;
      }

      setError(null);
      return payload.data || [];
    } catch (err) {
      console.error('Error fetching loans for approval:', err);
      setError(err.message || 'Failed to fetch loans for approval');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchLoansForApproval, loading, error };
}

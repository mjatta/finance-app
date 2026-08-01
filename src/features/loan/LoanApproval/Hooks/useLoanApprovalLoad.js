import { useState, useCallback } from 'react';
import { buildApiUrl } from '../../../../utils/apiConfig';

// Hook to fetch loans for approval on page load
export function useLoanApprovalLoad() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoansForApproval = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build API URL using the standard pattern
      const apiUrl = buildApiUrl('loan-approval', {
        ncompid: '30',
      });

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();

      // Handle if payload is directly an array
      if (Array.isArray(payload)) {
        return payload;
      }

      // Expected structure: { status, data: [ { ...loanData } ] }
      if (payload && typeof payload === 'object') {
        // Check for success status
        if (payload.status === 'success' && payload.data) {
          return payload.data;
        }
        
        // If payload is empty or has no data, return empty array
        if (payload.data) {
          return payload.data;
        }
      }

      if (!payload || typeof payload !== 'object') {
        setError('Invalid response structure');
        return [];
      }

      setError(null);
      return [];
    } catch (err) {
      console.error('Error fetching loans for approval:', err);
      setError(err.message || 'Failed to fetch loans for approval');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchLoansForApproval, loading, error };
}

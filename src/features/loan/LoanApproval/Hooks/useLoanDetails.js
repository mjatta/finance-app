import { useState, useCallback } from 'react';
import { buildApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook to fetch loan details for a specific customer and loan
 */
export function useLoanDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoanDetails = useCallback(async (ccustcode, tnloanid) => {
    setLoading(true);
    setError(null);

    try {
      if (!ccustcode || !tnloanid) {
        throw new Error('Missing ccustcode or tnloanid');
      }

      // Build API URL with memcode and tnloanid parameters
      const apiUrl = buildApiUrl('loan-details', {
        ncompid: '30',
        memcode: ccustcode,
        tnloanid: tnloanid,
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
      console.log('Loan Details Response:', payload);

      // Handle if payload is directly an object with the loan details
      if (payload && typeof payload === 'object') {
        // Check for success status
        if (payload.status === 'success' && payload.data) {
          return payload.data;
        }
        
        // If payload has the expected loan detail fields, return it directly
        if (payload.LoanType || payload.PrincipalAmt) {
          return payload;
        }
        
        // Check if payload.data exists
        if (payload.data && typeof payload.data === 'object') {
          return payload.data;
        }
      }

      setError('Invalid response structure');
      return null;
    } catch (err) {
      console.error('Error fetching loan details:', err);
      const errorMessage = err.message || 'Failed to fetch loan details';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchLoanDetails, loading, error };
}

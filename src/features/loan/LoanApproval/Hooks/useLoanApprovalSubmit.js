import { useState, useCallback } from 'react';
import { buildApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook to submit loan approval
 */
export function useLoanApprovalSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitLoanApproval = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      // Build API URL
      const apiUrl = buildApiUrl('loan-approval-approve', {});

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Loan Approval Submit Response:', result);

      // Handle both success and error responses
      if (result && typeof result === 'object') {
        // Check for success status
        if (result.status === 'success' || result.Success === true || result.Success === 'true') {
          return {
            success: true,
            message: result.message || result.Message || 'Loan approved successfully',
            data: result.data || result.Data || result,
          };
        }

        // Check for error status
        if (result.status === 'error' || result.Success === false || result.Success === 'false') {
          throw new Error(result.message || result.Message || 'Failed to approve loan');
        }

        // If response has a message but no explicit status, assume success
        if (result.message || result.Message) {
          return {
            success: true,
            message: result.message || result.Message,
            data: result,
          };
        }
      }

      return {
        success: true,
        message: 'Loan approved successfully',
        data: result,
      };
    } catch (err) {
      console.error('Error submitting loan approval:', err);
      const errorMessage = err.message || 'Failed to approve loan';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        error: err,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitLoanApproval, loading, error };
}

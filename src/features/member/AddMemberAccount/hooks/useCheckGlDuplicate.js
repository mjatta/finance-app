import { useState } from 'react';

/**
 * Custom hook to check GL duplicate and get account number.
 * GET /api/savingsaccount/CheckGlDuplicate/{customerCode}/250 (for Saving Account)
 * GET /api/Sharesaccount/CheckGlDuplicate/{customerCode}/270 (for Shares Account)
 */
export function useCheckGlDuplicate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkGlDuplicate = async (customerCode, accountType) => {
    setLoading(true);
    setError(null);

    try {
      if (!customerCode || !accountType) {
        throw new Error('Missing required fields: customerCode or accountType');
      }

      // Determine endpoint and GL code based on account type
      let endpoint = '';
      if (accountType === 'saving') {
        endpoint = `/api/savingsaccount/CheckGlDuplicate/${encodeURIComponent(customerCode)}/250`;
      } else if (accountType === 'shares') {
        endpoint = `/api/Sharesaccount/CheckGlDuplicate/${encodeURIComponent(customerCode)}/270`;
      } else {
        throw new Error(`Unknown account type: ${accountType}`);
      }

      console.log('Checking GL duplicate:', endpoint);

      const resp = await fetch(endpoint);
      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`);
      }

      const data = await resp.json();
      console.log('GL duplicate check response:', data);

      // Return the account number
      return {
        success: true,
        accountNo: data?.AccountNo || '',
        accountCode: data?.AccountCode || '',
      };
    } catch (err) {
      console.error('Check GL duplicate error:', err);
      setError(err.message || 'Unknown error');
      return {
        success: false,
        accountNo: '',
        accountCode: '',
      };
    } finally {
      setLoading(false);
    }
  };

  return { checkGlDuplicate, loading, error };
}

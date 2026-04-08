import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

// Hook to save deposit transaction
export function useDepositTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const saveDepositTransaction = async (formData, userId, compId, branchId) => {
    if (!formData || !userId) {
      setError('Missing required form data or user information');
      return null;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Map form data to API payload
      const payload = {
        tcAcctNumb: formData.accountNumber || '',
        gcContraAcct: formData.contraAccount || formData.accountNumber || '',
        gcControlAcct: formData.controlAccount || '',
        tnTranAmt: parseFloat(formData.depositAmount) || 0,
        tnContAmt: -Math.abs(parseFloat(formData.depositAmount)) || 0, // Negative of deposit amount
        dTranDate: formData.transactionDate || new Date().toISOString(),
        tcChqno: formData.checkNumber || '', // Map to check number
        lnServID: formData.productId || 5, // Product ID from Posting Account endpoint, default to 5
        gcUserid: userId,
        ncompid: compId,
        gnBranchid: branchId,
      };

      // Validate required fields
      if (!payload.tcAcctNumb) {
        throw new Error('Account number is required');
      }

      // Use relative path so Vite middleware can intercept and handle locally
      const url = getFullApiUrl('/api/Deposits/DepositUser');
      const response = await fetch(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP Error: ${response.status} ${response.statusText}`
        );
      }

      // Parse response - backend may return text or JSON
      let responseData;
      const responseText = await response.text();
      try {
        responseData = responseText ? JSON.parse(responseText) : { success: true };
      } catch {
        // Backend returned non-JSON (e.g. plain text success message) — treat as success
        responseData = { success: true, message: responseText };
      }

      setSuccess(true);
      setError(null);
      return responseData;
    } catch (err) {
      // Handle network errors and other exceptions
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.error('Network error or CORS issue saving deposit transaction:', err);
        setError('Network error. Please check your connection.');
      } else {
        console.error('Error saving deposit transaction:', err);
        setError(err.message || 'Failed to save deposit transaction');
      }
      setSuccess(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { saveDepositTransaction, loading, error, success };
}

import { useState } from 'react';

// Hook to save deposit transaction
export function useDepositTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const saveDepositTransaction = async (formData, userId) => {
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
        gcContraAcct: formData.accountNumber || '', // Map to account number
        gcControlAcct: formData.accountNumber || '', // Using account number as control account
        tnTranAmt: parseFloat(formData.depositAmount) || 0,
        tnContAmt: -Math.abs(parseFloat(formData.depositAmount)) || 0, // Negative of deposit amount
        dTranDate: formData.transactionDate || new Date().toISOString(),
        tcChqno: formData.memberCode || '', // Map to customer code (member code)
        lnServID: formData.productId || 5, // Product ID from Posting Account endpoint, default to 5
        gcUserid: userId,
      };

      // Validate required fields
      if (!payload.tcAcctNumb) {
        throw new Error('Account number is required');
      }

      const response = await fetch(
        '/api/Cusystem/DepositUser',
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

      // Parse response
      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.warn('Failed to parse deposit transaction response as JSON:', jsonError);
        setError('Invalid response format');
        return null;
      }

      // Validate response structure
      if (!responseData || typeof responseData !== 'object') {
        console.warn('Deposit transaction response is not an object:', responseData);
        setError('Invalid response structure');
        return null;
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

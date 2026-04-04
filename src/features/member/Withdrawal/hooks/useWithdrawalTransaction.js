import { useState } from 'react';

// Hook to save withdrawal transaction
export function useWithdrawalTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const saveWithdrawalTransaction = async (formData, userId) => {
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
        tnTranAmt: parseFloat(formData.withdrawalAmount) || 0,
        tnContAmt: -Math.abs(parseFloat(formData.withdrawalAmount)) || 0, // Negative of withdrawal amount
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
        '/api/Cusystem/WithdrawalUser',
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
        console.warn('Failed to parse withdrawal transaction response as JSON:', jsonError);
        setError('Invalid response format');
        return null;
      }

      // Validate response structure
      if (!responseData || typeof responseData !== 'object') {
        console.warn('Withdrawal transaction response is not an object:', responseData);
        setError('Invalid response structure');
        return null;
      }

      setSuccess(true);
      setError(null);
      return responseData;
    } catch (err) {
      // Handle network errors and other exceptions
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.error('Network error or CORS issue saving withdrawal transaction:', err);
        setError('Network error. Please check your connection.');
      } else {
        console.error('Error saving withdrawal transaction:', err);
        setError(err.message || 'Failed to save withdrawal transaction');
      }
      setSuccess(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { saveWithdrawalTransaction, loading, error, success };
}

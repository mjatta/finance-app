import { useState, useCallback } from 'react';

/**
 * Custom hook to fetch customer details from the backend API
 * @param {string} custCode - The customer code to fetch details for
 * @returns {object} - { customerData, isLoading, error, fetchCustomerDetails }
 */
export const useCustomerDetails = () => {
  const [customerData, setCustomerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomerDetails = useCallback(async (custCode) => {
    if (!custCode?.trim()) {
      setError('Please provide a customer code');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCustomerData(null);

    try {
      const response = await fetch(`/api/customer/details/${custCode.trim()}`);

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? 'Customer code not found'
            : `Failed to fetch customer details (${response.status})`
        );
      }

      const data = await response.json();

      // Validate response has expected fields
      if (data && typeof data === 'object') {
        // Map API payload to component format
        const fullName = [data.FirstName, data.MiddleName, data.LastName]
          .filter(Boolean)
          .join(' ')
          .trim() || data.CustomerName || '';

        setCustomerData({
          custCode: data.CustCode || custCode.trim(),
          fullName,
          savingBalance: data.SavingBalance
            ? parseFloat(data.SavingBalance).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : '0.00',
          shareBalance: data.ShareBalance
            ? parseFloat(data.ShareBalance).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : '0.00',
          loanBalance: data.LoanBalance
            ? parseFloat(data.LoanBalance).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : '0.00',
          // Additional fields for reference
          firstName: data.FirstName || '',
          middleName: data.MiddleName || '',
          lastName: data.LastName || '',
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customer details';
      setError(errorMessage);
      setCustomerData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    customerData,
    isLoading,
    error,
    fetchCustomerDetails,
  };
};

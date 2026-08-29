import { useState } from 'react';

export const useSaveCashManagerTills = () => {
  const [saveLoading, setSaveLoading] = useState(false);

  const saveTillAmounts = async (rows, branch, cashAccount, processType, userId) => {
    try {
      setSaveLoading(true);

      // Validate required fields
      if (!branch) {
        return { success: false, errorMessage: 'Please select a branch' };
      }

      if (!cashAccount) {
        return { success: false, errorMessage: 'Please select a cash account' };
      }

      if (!rows || rows.length === 0) {
        return { success: false, errorMessage: 'No cashier data to save' };
      }

      if (!userId) {
        return { success: false, errorMessage: 'User not authenticated' };
      }

      // Build items array with till amounts
      const items = rows.map(row => ({
        postAccount: row.accountNumber,
        tranAmount: -(Number(row.tillAmount) || 0), // Negative for withdrawal
        currentBalance: Number(row.currentBalance) || 0,
      }));

      // Determine transaction type
      const transactionType = processType === 'allocation' ? 1 : 2;

      // Build payload
      const payload = {
        companyId: 30,
        branchId: branch.branchCode || branch.branchid,
        contraAccount: cashAccount.accountNumber,
        userId: userId,
        transactionType: transactionType,
        items: items,
      };

      // Call API
      const response = await fetch('/api/CashManager/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // Check if response indicates an error (either HTTP error or API error)
      if (!response.ok) {
        // Extract error message from response
        const errorMessage = result?.Message || result?.message || result?.error || `HTTP error! status: ${response.status}`;
        return { success: false, errorMessage };
      }

      // Check for API-level errors even if HTTP status is 200
      if (result?.Message && result.Message.toLowerCase().includes('error')) {
        return { success: false, errorMessage: result.Message };
      }

      console.log('Save result:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error saving till amounts:', error);
      return { success: false, errorMessage: error.message || 'Failed to save till amounts' };
    } finally {
      setSaveLoading(false);
    }
  };

  return { saveTillAmounts, saveLoading };
};

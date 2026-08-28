import { useState } from 'react';
import { notifySaveSuccess, notifySaveError } from '../../../../utils/saveNotifications';

export const useSaveCashManagerTills = () => {
  const [saveLoading, setSaveLoading] = useState(false);

  const saveTillAmounts = async (rows, branch, cashAccount, processType, userId) => {
    try {
      setSaveLoading(true);

      // Validate required fields
      if (!branch) {
        notifySaveError('Please select a branch');
        return { success: false };
      }

      if (!cashAccount) {
        notifySaveError('Please select a cash account');
        return { success: false };
      }

      if (!rows || rows.length === 0) {
        notifySaveError('No cashier data to save');
        return { success: false };
      }

      if (!userId) {
        notifySaveError('User not authenticated');
        return { success: false };
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      notifySaveSuccess('Till amounts saved successfully');
      console.log('Save result:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error saving till amounts:', error);
      notifySaveError(error.message || 'Failed to save till amounts');
      return { success: false, error: error.message };
    } finally {
      setSaveLoading(false);
    }
  };

  return { saveTillAmounts, saveLoading };
};

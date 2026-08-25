import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Determines if an account is a Loan account based on account name
 * @param {string} accountName - The account name
 * @returns {boolean} - True if account is a Loan
 */
export const isLoanAccount = (accountName) => {
  if (!accountName || typeof accountName !== 'string') return false;
  return /loan/i.test(accountName.trim());
};

/**
 * Hook to handle chained API calls for Account Transfer workflow:
 * 1. Withdrawal from source account
 * 2. Deposit to target account (if Savings/Shares) OR Loan Repayment (if Loan)
 */
export function useTransferChainedAPIs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute withdrawal posting
   */
  const executeWithdrawal = async (formData, userId, compId, branchId) => {
    const payload = {
      tcAcctNumb: formData.accountNumber || '',
      gcContraAcct: formData.contraAccount || formData.accountNumber || '',
      gcControlAcct: formData.controlAccount || '',
      tnTranAmt: parseFloat(formData.withdrawalAmount) || 0,
      tnContAmt: -Math.abs(parseFloat(formData.withdrawalAmount)) || 0,
      dTranDate: formData.transactionDate || new Date().toISOString(),
      tcChqno: formData.checkNumber || '',
      lnServID: formData.productId || 5,
      gcUserid: userId,
      ncompid: compId,
      gnBranchid: branchId,
      region: formData.selectedRegionId || '',
    };

    const url = getFullApiUrl('/api/Withdrawals/WithdrawalUser');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Withdrawal failed: ${response.status}`);
    }

    const responseText = await response.text();
    try {
      return responseText ? JSON.parse(responseText) : { success: true };
    } catch {
      return { success: true, message: responseText };
    }
  };

  /**
   * Execute deposit posting
   */
  const executeDeposit = async (formData, userId, compId, branchId) => {
    const payload = {
      tcAcctNumb: formData.accountNumber || '',
      gcContraAcct: formData.contraAccount || formData.accountNumber || '',
      gcControlAcct: formData.controlAccount || '',
      tnTranAmt: parseFloat(formData.depositAmount) || 0,
      tnContAmt: -Math.abs(parseFloat(formData.depositAmount)) || 0,
      dTranDate: formData.transactionDate || new Date().toISOString(),
      tcChqno: formData.checkNumber || '',
      lnServID: formData.productId || 5,
      gcUserid: userId,
      ncompid: compId,
      gnBranchid: branchId,
      region: formData.selectedRegionId || '',
    };

    const url = getFullApiUrl('/api/Deposits/DepositUser');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Deposit failed: ${response.status}`);
    }

    const responseText = await response.text();
    try {
      return responseText ? JSON.parse(responseText) : { success: true };
    } catch {
      return { success: true, message: responseText };
    }
  };

  /**
   * Execute loan repayment posting
   */
  const executeLoanRepayment = async (formData, userId, compId, branchId) => {
    const payload = {
      CompId: compId || 30,
      AccountNumber: formData.accountNumber || '',
      ContraAccount: formData.contraAccount || '11000130101',
      ControlAcct: formData.controlAccount || '13100110101',
      LoanProduct: formData.productId || 5,
      PaymentOption: formData.paymentOption || 2, // 2 = cash
      PaymentAmount: parseFloat(formData.repaymentAmount) || 0,
      TotalAccruedInterest: formData.totalAccruedInterest || 0,
      TranDate: formData.transactionDate || new Date().toISOString(),
      ChequeNo: formData.checkNumber || '',
      cUserID: userId,
      lbranchid: branchId,
      region: formData.selectedRegionId || '',
      llcBank: 0,
    };

    const url = getFullApiUrl('/api/loanRepayment/InsertLoanRepayment');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Loan repayment failed: ${response.status}`);
    }

    return await response.json();
  };

  /**
   * Execute chained Account Transfer workflow:
   * 1. Withdrawal from source
   * 2. Deposit or Loan Repayment to target
   */
  const executeAccountTransfer = async (params) => {
    if (!params || !params.userId) {
      throw new Error('Missing required parameters: userId, compId, branchId');
    }

    setLoading(true);
    setError(null);

    try {
      const {
        fromFormData,
        toFormData,
        toAccountName,
        userId,
        compId,
        branchId,
      } = params;

      // Step 1: Execute withdrawal from source account
      console.log('Step 1: Executing withdrawal from source account...');
      const withdrawalResult = await executeWithdrawal(
        fromFormData,
        userId,
        compId,
        branchId
      );
      console.log('Withdrawal successful:', withdrawalResult);

      // Step 2: Execute deposit or loan repayment to target account
      let depositResult;
      if (isLoanAccount(toAccountName)) {
        console.log('Step 2: Executing loan repayment to target account...');
        depositResult = await executeLoanRepayment(
          toFormData,
          userId,
          compId,
          branchId
        );
        console.log('Loan repayment successful:', depositResult);
      } else {
        console.log('Step 2: Executing deposit to target account...');
        depositResult = await executeDeposit(
          toFormData,
          userId,
          compId,
          branchId
        );
        console.log('Deposit successful:', depositResult);
      }

      setLoading(false);
      return {
        success: true,
        withdrawal: withdrawalResult,
        deposit: depositResult,
        message: 'Account transfer completed successfully',
      };
    } catch (err) {
      console.error('Account transfer error:', err);
      setError(err.message || 'Account transfer failed');
      setLoading(false);
      return null;
    }
  };

  return { executeAccountTransfer, loading, error };
}

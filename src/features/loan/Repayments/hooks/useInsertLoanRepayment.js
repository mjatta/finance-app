import { useCallback } from 'react';

/**
 * Hook to insert a loan repayment
 * @returns {insertLoanRepayment}
 */
export function useInsertLoanRepayment() {
  /**
   * Insert loan repayment
   * @param {Object} params - All required fields for the payload
   * @returns {Promise<Object|null>}
   */
  const insertLoanRepayment = useCallback(async (params) => {
    try {
      // Map repayment type to PaymentOption
      let paymentOption = 0;
      if (params.repaymentType === 'cheque') paymentOption = 1;
      else if (params.repaymentType === 'cash') paymentOption = 2;
      // Build payload
      const payload = {
        CompId: 30,
        AccountNumber: params.accountNumber,
        ContraAccount: '11000130101',
        ControlAcct: '13100110101',
        LoanProduct: params.productId,
        PaymentOption: paymentOption,
        PaymentAmount: params.repaymentAmount,
        TotalAccruedInterest: params.totalAccruedInterest,
        TranDate: params.transactionDate,
        ChequeNo: params.checkNumber || '',
        cUserID: params.username,
        lcurrcode: 1,
        lbranchid: params.branchId,
        llcBank: 0,
      };
      const resp = await fetch('/api/loanRepayment/InsertLoanRepayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Failed to save loan repayment');
      return await resp.json();
    } catch {
      return null;
    }
  }, []);

  return { insertLoanRepayment };
}

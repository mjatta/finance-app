import dayjs from 'dayjs';

export const useLoanBadDebtExpenses = async (
  accountNumber,
  loansControlAccount,
  badDebtExpense,
  productId,
  savingsBalance,
  sharesBalance,
  totalOutstanding
) => {
  try {
    // Get user data from localStorage
    const authData = JSON.parse(localStorage.getItem('microfinance-auth') || '{}');
    const user = authData?.state?.user || {};
    const compId = authData?.state?.user?.CompId || user?.CompId;
    const username = authData?.state?.user?.username || user?.username;
    const branchId = authData?.state?.user?.BranchId || user?.BranchId;

    // Calculate PaymentAmount: Math.abs(totalOutstanding) - savingsBalance - sharesBalance
    const savBalance = Number(savingsBalance) || 0;
    const shareBalance = Number(sharesBalance) || 0;
    const totalOutstandingAbs = Math.abs(Number(totalOutstanding) || 0);
    const paymentAmount = Math.abs(totalOutstandingAbs - savBalance - shareBalance);

    const tranDate = dayjs().format('YYYY-MM-DDTHH:mm:ss');

    // First payload - Savings Balance
    const payload1 = {
      CompId: compId,
      AccountNumber: accountNumber,
      ContraAccount: loansControlAccount,
      ControlAcct: badDebtExpense,
      LoanProduct: productId,
      PaymentOption: 1,
      PaymentAmount: paymentAmount,
      TotalAccruedInterest: 0.0,
      TranDate: tranDate,
      ChequeNo: '0001',
      cUserID: username,
      lbranchid: branchId,
      llcBank: 0,
    };

    // Second payload - Shares Balance (ContraAccount and ControlAcct swapped)
    const payload2 = {
      CompId: compId,
      AccountNumber: accountNumber,
      ContraAccount: badDebtExpense,
      ControlAcct: loansControlAccount,
      LoanProduct: productId,
      PaymentOption: 1,
      PaymentAmount: paymentAmount,
      TotalAccruedInterest: 0.0,
      TranDate: tranDate,
      ChequeNo: '0001',
      cUserID: username,
      lbranchid: branchId,
      llcBank: 0,
    };

    // Make first API call
    const response1 = await fetch('/api/loanRepayment/InsertLoanRepayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload1),
    });

    if (!response1.ok) {
      throw new Error(`Failed to insert loan repayment (1st call): ${response1.status}`);
    }

    // Make second API call
    const response2 = await fetch('/api/loanRepayment/InsertLoanRepayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload2),
    });

    if (!response2.ok) {
      throw new Error(`Failed to insert loan repayment (2nd call): ${response2.status}`);
    }

    const data1 = await response1.json();
    const data2 = await response2.json();

    return {
      success: true,
      result1: data1,
      result2: data2,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
};

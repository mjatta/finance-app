import { useState } from 'react';
import dayjs from 'dayjs';

export const useProcessBadDebt = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const processBadDebt = async ({
    savingsAccountNumber,
    sharesAccountNumber,
    loansControlAccount,
    productId,
    savingsBalance,
    sharesBalance,
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get user data from localStorage (Zustand persisted store)
      const authData = JSON.parse(localStorage.getItem('microfinance-auth') || '{}');
      const userState = authData?.state?.user || {};
      const compId = userState?.CompId || '';
      const userName = userState?.name || '';
      const branchId = userState?.BranchId || '';

      const today = dayjs().format('YYYY-MM-DDTHH:mm:ss');

      // Payload for savings (tcAcctNumb included, tnTranAmt negative, tnContAmt positive)
      const savingsPayload = {
        ncompid: compId,
        tcAcctNumb: savingsAccountNumber || '',
        gcContraAcct: loansControlAccount || '',
        gcControlAcct: loansControlAccount,
        tnTranAmt: -Math.abs(Number(savingsBalance) || 0),
        tnContAmt: Math.abs(Number(savingsBalance) || 0),
        tcChqno: '',
        gcUserid: userName,
        gnBranchid: branchId,
        lnServID: productId,
        dTranDate: today,
      };

      // Payload for shares (tcAcctNumb included, tnTranAmt negative, tnContAmt positive)
      const sharesPayload = {
        ncompid: compId,
        tcAcctNumb: sharesAccountNumber || '',
        gcContraAcct: loansControlAccount || '',
        gcControlAcct: loansControlAccount,
        tnTranAmt: -Math.abs(Number(sharesBalance) || 0),
        tnContAmt: Math.abs(Number(sharesBalance) || 0),
        tcChqno: '',
        gcUserid: userName,
        gnBranchid: branchId,
        lnServID: productId,
        dTranDate: today,
      };
      // Call savings bad debt endpoint
      const savingsResponse = await fetch('/api/Withdrawal/BadDebt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(savingsPayload),
      });

      if (!savingsResponse.ok) {
        throw new Error(`Failed to process savings bad debt: ${savingsResponse.status}`);
      }

      // Call shares bad debt endpoint
      const sharesResponse = await fetch('/api/Withdrawal/BadDebt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sharesPayload),
      });

      if (!sharesResponse.ok) {
        throw new Error(`Failed to process shares bad debt: ${sharesResponse.status}`);
      }

      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { processBadDebt, isLoading, error };
};

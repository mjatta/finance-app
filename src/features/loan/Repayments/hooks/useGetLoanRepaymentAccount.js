import { useCallback } from 'react';

/**
 * Custom hook to fetch loan repayment account details
 * @returns { fetchLoanRepaymentAccount }
 */
export function useGetLoanRepaymentAccount() {
  /**
   * Fetch loan repayment account details
   * @param {string} accountNumber
   * @param {string} tranDate - YYYY-MM-DD
   * @param {number} ncompid
   * @returns {Promise<Object|null>}
   */
  const fetchLoanRepaymentAccount = useCallback(async (accountNumber, tranDate, ncompid = 30) => {
    if (!accountNumber || !tranDate) return null;
    try {
      const url = `/api/LoanRepayment/getLoanRepaymentAccount?accountNumber=${encodeURIComponent(accountNumber)}&ncompid=${ncompid}&tranDate=${tranDate}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to fetch loan repayment account');
      return await resp.json();
    } catch {
      return null;
    }
  }, []);

  return { fetchLoanRepaymentAccount };
}

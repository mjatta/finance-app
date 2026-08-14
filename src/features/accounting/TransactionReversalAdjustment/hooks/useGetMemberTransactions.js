import { useState } from 'react';

const COMPANY_ID = 30;

/**
 * Custom hook to fetch member transactions for reversal or adjustment.
 * GET /api/reversal/member-transactions/{customerCode}?reversal=true|false&companyId=30
 * @returns {Object} { transactions, loading, error, fetchMemberTransactions }
 */
export function useGetMemberTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch member transactions.
   * @param {string} customerCode
   * @param {boolean} isReversal - true for Reversal, false for Adjustment
   */
  const fetchMemberTransactions = async (customerCode, isReversal) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/reversal/member-transactions/${encodeURIComponent(customerCode)}?reversal=${isReversal ? 'true' : 'false'}&companyId=${COMPANY_ID}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to fetch member transactions');
      const data = await resp.json();

      // Handle multiple response formats
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.data)) {
        list = data.data;
      } else if (Array.isArray(data?.result)) {
        list = data.result;
      } else if (data?.success && Array.isArray(data?.transactions)) {
        list = data.transactions;
      } else {
        console.warn('Unexpected response format:', data);
      }

      // Backend rows have no unique identifier field (no `itemid`), which
      // DataGrid's getRowId relies on. Derive a stable, unique id from the
      // voucher/account/transaction-code plus index so selection works.
      list = list.map((row, index) => ({
        ...row,
        itemid: [
          String(row.cvoucherno || '').trim(),
          String(row.cacctnumb || '').trim(),
          String(row.ctrancode || '').trim(),
          index,
        ].join('-'),
      }));

      setTransactions(list);
      return list;
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Unknown error');
      setTransactions([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { transactions, loading, error, fetchMemberTransactions };
}

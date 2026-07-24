import { useState } from 'react';
import dayjs from 'dayjs';
import { useAuthStore } from '../../../../store/authStore';

/**
 * Custom hook to save transaction reversal or adjustment.
 * POST /api/reversal/reverse (for reversal)
 * POST /api/reversal/adjust (for adjustment)
 */
export function useSaveTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const user = useAuthStore((state) => state.user);

  const saveTransaction = async ({
    transactionType,
    customerCode,
    transactionDate,
    selectedTransactions,
    userId = user?.username || 'SYSTEM',
    companyId = 30,
    branchId = 16,
    currencyCode = 1,
  }) => {
    setLoading(true);
    setError(null);

    try {
      if (!transactionType || !customerCode || !selectedTransactions || selectedTransactions.length === 0) {
        throw new Error('Missing required fields: transactionType, customerCode, or selectedTransactions');
      }

      const isReversal = transactionType === 'reversal';
      const endpoint = isReversal ? '/api/reversal/reverse' : '/api/reversal/adjust';
      const dateStr = dayjs(transactionDate).format('YYYY-MM-DD');

      // Map grid rows to API transaction format
      const transactions = selectedTransactions.map((row) => ({
        ItemId: String(row.itemid),
        AccountNo: String(row.cacctnumb).trim(),
        ContraAccount: String(row.ccontra).trim(),
        Debit: Number(row.ndebit) || 0,
        Credit: Number(row.ncredit) || 0,
        TranDate: row.dtrandate || dateStr,
        ValueDate: row.dvaluedate || dateStr,
        Selected: true,
        Description: String(row.ctrandesc).trim(),
      }));

      const payload = {
        MemberCode: String(customerCode).trim(),
        Description: isReversal ? 'Transaction Reversal' : 'Transaction Adjustment',
        UserId: userId,
        CompanyId: companyId,
        BranchId: branchId,
        CurrencyCode: currencyCode,
        TransactionDate: dateStr,
        Transactions: transactions,
      };

      // Add reversal-specific fields
      if (isReversal) {
        payload.ReverseByMember = true;
        payload.IsReversal = true;
      }

      console.log('Saving transaction:', endpoint, payload);

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || `API error: ${resp.status}`);
      }

      const result = await resp.json();
      console.log('Save transaction response:', result);
      return result;
    } catch (err) {
      console.error('Save transaction error:', err);
      setError(err.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { saveTransaction, loading, error };
}

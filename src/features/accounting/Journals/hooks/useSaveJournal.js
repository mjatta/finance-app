import { useState } from 'react';

export function useSaveJournal() {
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);

  const saveJournal = async (formData, accountDebits = [], accountCredits = []) => {
    setIsSaving(true);
    try {
      // Get user info from zustand-persisted localStorage (key: 'microfinance-auth')
      let user = null;
      try {
        const persisted = localStorage.getItem('microfinance-auth');
        if (persisted) {
          const parsed = JSON.parse(persisted);
          user = parsed?.state?.user || null;
        }
      } catch {
        // Ignore JSON parse/localStorage errors
      }
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        OrderType: 1,
        CurrCode: 1,
        UserId: user?.UserId || user?.userId || user?.username || '',
        BranchId: user?.BranchId || user?.branchId || '',
        CompId: user?.CompId || user?.compId || '',
        Entries: [
          {
            TransDate: formData.batchEntryDate || today,
            Description: formData.batchTransactionDetails || '',
            DebitAccount: accountDebits[0]?.value || '',
            CreditAccount: accountCredits[0]?.value || '',
            Debit: parseFloat(formData.transactionDebitAmount) || 0,
            Credit: parseFloat(formData.transactionCreditAmount) || 0,
            BookBalance: parseFloat(formData.bookBalance) || 0,
            InvFile: formData.uploadDocument || ''
          }
        ]
      };
      const response = await fetch('/api/journal/postjournal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to save journal');
      setStatusMessage('Journal details saved successfully');
      setStatusError(false);
      return { success: true };
    } catch (error) {
      setStatusMessage('Error saving journal details: ' + error.message);
      setStatusError(true);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  };

  return { saveJournal, isSaving, statusMessage, statusError };
}

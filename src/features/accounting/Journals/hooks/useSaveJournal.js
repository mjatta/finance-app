import { useState } from 'react';

export function useSaveJournal() {
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);

  const saveJournal = async (gridData) => {
    setIsSaving(true);
    try {
      const payload = {
        OrderType: 1,
        UserId: 'ala',
        CompId: 30,
        CurrCode: 1,
        BranchId: 16,
        Entries: gridData.map(row => ({
          TransDate: row.date || '',
          Description: row.transactionComments || '',
          DebitAccount: row.accountDebit || '',
          CreditAccount: row.accountCredit || '',
          Debit: parseFloat(row.debitAmount) || 0,
          Credit: parseFloat(row.creditAmount) || 0,
          BookBalance: row.bookBalance || 0,
          InvFile: row.uploadDocument || ''
        }))
      };
      const response = await fetch('https://alakuyateh-001-site10.atempurl.com/api/journal/postjournal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to save journal');
      setStatusMessage('Journal details saved successfully');
      setStatusError(false);
    } catch (error) {
      setStatusMessage('Error saving journal details: ' + error.message);
      setStatusError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return { saveJournal, isSaving, statusMessage, statusError };
}

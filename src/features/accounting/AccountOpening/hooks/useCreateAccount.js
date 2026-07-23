import { useState } from 'react';

/**
 * Custom hook to create a new GL account.
 * Calls POST /api/accounts/create
 * Sample payload:
 * {
 *   "AccountNumber": "15000133101",
 *   "AccountName": "Ala Bank Account",
 *   "BranchId": 1,
 *   "AccountItem": "001331",
 *   "UserId": "ALA",
 *   "CurrencyCode": 1,
 *   "SubGroupCode": "150",
 *   "CompanyId": 30
 * }
 * @returns {Object} { loading, error, createAccount }
 */
export function useCreateAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createAccount = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await resp.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!resp.ok) {
        const message = (data && data.message) || 'Failed to create account';
        throw new Error(message);
      }

      return data;
    } catch (err) {
      setError(err.message || 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, createAccount };
}

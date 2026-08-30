import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook for POST /api/interest-calculation/interest/apply
 * Body: {
 *   companyId: 30,
 *   userId: "ALA",
 *   branchId: 16,
 *   currencyCode: 1,
 *   processDate: "2026-08-24T00:00:00",
 *   savingsControlAccount: "25100220101",
 *   savingsExpenseAccount: "76000730201"
 * }
 */
export function useApplyInterest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const applyInterest = async ({
    companyId,
    userId,
    branchId,
    currencyCode = 1,
    processDate,
    savingsControlAccount,
    savingsExpenseAccount,
  }) => {
    setLoading(true);
    setError(null);
    try {
      const url = getFullApiUrl('/api/interest-calculation/interest/apply');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          userId,
          branchId,
          currencyCode,
          processDate,
          savingsControlAccount,
          savingsExpenseAccount,
        }),
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        throw new Error(payload?.Message || payload?.message || `Apply interest failed (status ${res.status})`);
      }

      return { success: true, data: payload };
    } catch (err) {
      const message = err.message || 'Failed to apply interest';
      setError(message);
      return { success: false, errorMessage: message };
    } finally {
      setLoading(false);
    }
  };

  return { applyInterest, loading, error };
}

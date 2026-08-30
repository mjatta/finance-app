import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

/**
 * Hook for POST /api/interest-calculation/accrued-interest/calculate
 * Body: { CompanyId, ProductId } OR { CompanyId, ProductId, StartYear, StartMonth, EndMonth }
 * Dates are optional; used only when provided.
 */
export function useCalculateAccruedInterest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateAccruedInterest = async ({ companyId = 30, productId, startYear, startMonth, endMonth } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const url = getFullApiUrl('/api/interest-calculation/accrued-interest/calculate');
      const bodyPayload = {
        CompanyId: companyId,
        ProductId: productId,
      };
      // Include date fields only if provided
      if (startYear !== undefined) bodyPayload.StartYear = startYear;
      if (startMonth !== undefined) bodyPayload.StartMonth = startMonth;
      if (endMonth !== undefined) bodyPayload.EndMonth = endMonth;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        throw new Error(payload?.Message || payload?.message || `Calculate failed (status ${res.status})`);
      }

      return { success: true, data: payload };
    } catch (err) {
      const message = err.message || 'Failed to calculate accrued interest';
      setError(message);
      return { success: false, errorMessage: message };
    } finally {
      setLoading(false);
    }
  };

  return { calculateAccruedInterest, loading, error };
}

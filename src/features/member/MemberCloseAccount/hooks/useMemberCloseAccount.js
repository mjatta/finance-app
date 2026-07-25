import { useState, useCallback } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useMemberCloseAccount() {
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState(null);
  const [closeError, setCloseError] = useState(null);
  const [data, setData] = useState(null);

  const fetchMemberDetails = useCallback(async (customerCode) => {
    if (!customerCode || !customerCode.trim()) {
      setError('Customer code is required');
      return null;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const paddedCode = customerCode.toString().padStart(6, '0');
      const url = getFullApiUrl(`/api/member/details/${paddedCode}/A`);
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch member details: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch member details';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const closeMemberAccount = useCallback(async (memberCode) => {
    if (!memberCode || !memberCode.trim()) {
      setCloseError('Member code is required');
      return false;
    }

    setClosing(true);
    setCloseError(null);

    try {
      const paddedCode = memberCode.toString().padStart(6, '0');
      const url = getFullApiUrl('/api/member/close');
      const payload = {
        MemberCode: paddedCode,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to close account: ${response.statusText}`);
      }

      const result = await response.json();
      return true;
    } catch (err) {
      const errorMsg = err.message || 'Failed to close member account';
      setCloseError(errorMsg);
      return false;
    } finally {
      setClosing(false);
    }
  }, []);

  return {
    fetchMemberDetails,
    closeMemberAccount,
    loading,
    closing,
    error,
    closeError,
    data,
  };
}

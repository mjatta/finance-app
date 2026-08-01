import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useUpdateAccountStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map status display names to status codes
  const getStatusCode = (statusName) => {
    const codeMap = {
      'Close': 'C',
      'Inactive': 'I',
      'Dormant': 'D',
      'Frozen': 'F',
    };
    return codeMap[statusName] || '';
  };

  const updateAccountStatus = async (accountNumber, selectedStatus, userId = '') => {
    try {
      setLoading(true);
      setError(null);

      // Get userId from localStorage if not provided
      let finalUserId = userId;
      if (!finalUserId) {
        try {
          const authData = localStorage.getItem('microfinance-auth');
          if (authData) {
            const parsed = JSON.parse(authData);
            finalUserId = parsed.state?.user?.username || 'system';
          }
        } catch (e) {
          console.warn('Could not read userId from localStorage:', e);
          finalUserId = 'system';
        }
      }

      const statusCode = getStatusCode(selectedStatus);

      const payload = {
        accountNumber: accountNumber.trim(),
        activityType: statusCode,
        statusType: statusCode,
        balance: 0,
        userId: finalUserId,
      };


      const url = getFullApiUrl('/api/account/update-status');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return { success: true, data: result };
    } catch (err) {
      console.error('Error updating account status:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { updateAccountStatus, loading, error };
}

import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';
import { useAuthStore } from '../../../../store/authStore';

export function useSaveLog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const user = useAuthStore((state) => state.user);

  const saveLog = async (page, action, status, payload, message = '', errorMsg = '') => {
    try {
      setLoading(true);
      setError(null);

      const logPayload = {
        dateTime: new Date().toISOString(), // ISO format with timezone info for user's timezone
        user: user?.username || 'SYSTEM',
        page: page || '',
        action: action || '',
        status: status || '',
        payload: payload ? JSON.stringify(payload) : '',
        message: message || '',
        error: errorMsg || '',
      };

      console.log('Saving log:', logPayload);

      const url = getFullApiUrl('/api/systemAdministration/InsertLogs');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Log saved successfully:', result);

      return { success: true, data: result };
    } catch (err) {
      console.error('Error saving log:', err.message);
      setError(err.message);
      // Don't throw - allow operations to continue even if logging fails
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { saveLog, loading, error };
}

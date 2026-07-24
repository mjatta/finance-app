import { useState } from 'react';
import { useAuthStore } from '../../../../store/authStore';

export const useSaveAccount = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const user = useAuthStore((state) => state.user);

  const saveAccount = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/member-account/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setLoading(false);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err.message || 'Failed to save account';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  return { saveAccount, loading, error };
};

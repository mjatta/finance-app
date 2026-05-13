import { useState } from 'react';
import { getFullApiUrl } from '../../../utils/apiConfig';

export function useUpdatePassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updatePassword = async ({ userId, oldPassword, newPassword, confirmPassword }) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(getFullApiUrl('/api/changepassword/update'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserID: userId,
          OldPassword: oldPassword,
          NewPassword: newPassword,
          ConfirmPassword: confirmPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = payload?.message || payload?.Message || 'Failed to change password.';
        setError(message);
        return { success: false, error: message };
      }

      return { success: true, data: payload };
    } catch (err) {
      const message = err?.message || 'Failed to change password.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { updatePassword, loading, error };
}

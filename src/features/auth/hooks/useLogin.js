import { useState } from 'react';
import { getApiUrl } from '../../../utils/apiConfig';
import { useLoginLogger } from '../../../hooks/useLoginLogger';

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { logAttempt } = useLoginLogger();

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const url = getApiUrl('auth-login');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userID: username, password }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const reason = `HTTP ${response.status} ${text}`;
        // log failed attempt (backend rejected credentials)
        logAttempt({ username, status: 'failure', reason });
        throw new Error('Invalid username or password');
      }

      const data = await response.json();
      // log successful attempt
      try { logAttempt({ username, status: 'success' }); } catch (e) { /* ignore */ }
      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Login failed';
      try { logAttempt({ username, status: 'failure', reason: message }); } catch (e) { /* ignore */ }
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

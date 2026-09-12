import { useState } from 'react';
import { getApiUrl } from '../../../utils/apiConfig';

/**
 * Handles the two-step OTP (2FA) authentication flow:
 * 1. requestOtpLogin(username, password) - verifies credentials, backend responds
 *    with AWAITING_2FA + a short-lived tempToken and emails a 6-digit code.
 * 2. verifyOtp(tempToken, code) - passes tempToken as a Bearer token to prove the
 *    caller already passed the password check, along with the 6-digit code.
 */
export function useAuthOtp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestOtpLogin = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const url = getApiUrl('auth-otp-login');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = (data && (data.message || data.Message)) || `HTTP ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Login failed';
      setError(message);
      return { success: false, error: message, status: err.status };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (tempToken, code) => {
    setLoading(true);
    setError(null);
    try {
      const url = getApiUrl('auth-otp-verify');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tempToken}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = (data && data.message) || `HTTP ${response.status}`;
        throw new Error(message);
      }

      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Invalid or expired code';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (tempToken) => {
    setLoading(true);
    setError(null);
    try {
      const url = getApiUrl('auth-otp-resend');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tempToken}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = (data && data.message) || `HTTP ${response.status}`;
        throw new Error(message);
      }

      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Failed to resend code';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { requestOtpLogin, verifyOtp, resendOtp, loading, error };
}

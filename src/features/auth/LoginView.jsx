import React, { useState, useEffect, useRef } from 'react';
import * as Sentry from "@sentry/react";
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import { useAuthOtp } from './hooks/useAuthOtp';
import { useCreditUnionDetails } from './hooks/useCreditUnionDetails';
import { useSaveLoginAttempt } from '../system/LoginAttempts/hooks/useSaveLoginAttempt';
import { useAreas } from '../../hooks/useAreas';
import { useAuthStore } from '../../store/authStore';

const loginHighlights = [
  'Centralized member and loan operations',
  'Role-based access for secure workflows',
  'Fast access to reporting and accounting tools',
];

const SESSION_LOGOUT_REASON_KEY = 'microfinance_logout_reason';
const MAX_OTP_ATTEMPTS = 5;

const getInitialErrorMessage = () => {
  const logoutReason = localStorage.getItem(SESSION_LOGOUT_REASON_KEY);

  if (logoutReason === 'idle') {
    localStorage.removeItem(SESSION_LOGOUT_REASON_KEY);
    return 'Session expired after 10 minutes of inactivity. Please sign in again.';
  }

  if (logoutReason === 'absolute') {
    localStorage.removeItem(SESSION_LOGOUT_REASON_KEY);
    return 'Session expired after 5 hours. Please sign in again.';
  }

  if (logoutReason === 'tab-closed') {
    localStorage.removeItem(SESSION_LOGOUT_REASON_KEY);
    return 'Session closed. Please sign in again.';
  }

  return '';
};

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(() => getInitialErrorMessage());
  const { requestOtpLogin, verifyOtp, resendOtp, loading: otpLoading } = useAuthOtp();
  const { fetchCreditUnionDetails } = useCreditUnionDetails();
  const { saveLoginAttempt } = useSaveLoginAttempt();
  const { fetchAreas } = useAreas();
  const setAuthUser = useAuthStore((state) => state.setUser);
  const setCompanyDetails = useAuthStore((state) => state.setCompanyDetails);

  // Two-factor authentication (OTP) state
  const [otpStage, setOtpStage] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTempToken, setOtpTempToken] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  // Full user profile (UserID, CompId, featurePermissions, pagePermissions, etc.) returned
  // alongside the AWAITING_2FA response. Held in memory only until the code is verified,
  // then persisted to localStorage exactly like the legacy /api/auth/login flow.
  const [otpPendingUserData, setOtpPendingUserData] = useState(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpLockedOut, setOtpLockedOut] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [otpResendLoading, setOtpResendLoading] = useState(false);
  const [otpResendMessage, setOtpResendMessage] = useState('');
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (!otpStage) {
      return undefined;
    }
    const timer = setInterval(() => {
      setOtpSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpStage]);

  // Cooldown timer to throttle how often the user can request a new code
  useEffect(() => {
    if (otpResendCooldown <= 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      setOtpResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpResendCooldown]);

  // Auto-focus the code field as soon as the OTP screen appears
  useEffect(() => {
    if (otpStage && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpStage]);

  const formatCountdown = (totalSeconds) => {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const finalizeLogin = async (apiUser, normalizedUsername, loginStartTime) => {
    const features = (apiUser.features || '').split(',').map((f) => f.trim()).filter(Boolean);
    const role = (apiUser.Role || '').split(',')[0].trim();

    const safeUser = {
      id: apiUser.ExternalId ? apiUser.ExternalId.trim() : normalizedUsername,
      name: apiUser.UserName ? apiUser.UserName.trim() : normalizedUsername,
      username: apiUser.UserID ? apiUser.UserID.trim() : normalizedUsername,
      mustChangePassword: Boolean(apiUser.MustChangePassword || apiUser.ResetPassword),
      role: role || 'USER',
      access: {
        allPages: apiUser.Allpages ?? false,
        features,
        featurePermissions: apiUser.featurePermissions || {},
        pagePermissions: apiUser.pagePermissions || {},
      },
      CompId: apiUser.CompId,
      BranchId: apiUser.BranchId,
      CashAccount: apiUser.CashAccount || '',
      SuspenseAccount: apiUser.SuspenseAccount || '',
      DebitLimit: apiUser.DebitLimit ?? 0,
      CreditLimit: apiUser.CreditLimit ?? 0,
      LoanLimit: apiUser.LoanLimit ?? 0,
      AccessLevel: apiUser.AccessLevel ?? 0,
      IsCashier: apiUser.IsCashier ?? false,
      staffno: apiUser.staffno ? apiUser.staffno.trim() : '',
      Dateforce: apiUser.Dateforce || '',
    };

    // Set Sentry user context for successful login
    Sentry.setUser({
      id: safeUser.id,
      username: safeUser.username,
      role: safeUser.role,
      CompId: safeUser.CompId,
    });

    // Save to Zustand + localStorage
    setAuthUser(safeUser);

    // Fetch credit union details using CompId
    if (apiUser.CompId) {
      const companyDetails = await fetchCreditUnionDetails(apiUser.CompId);
      if (companyDetails) {
        setCompanyDetails(companyDetails);
      }
    }

    // Log successful login attempt
    saveLoginAttempt(normalizedUsername, true);

    // Capture successful login in Sentry
    Sentry.captureMessage('User login successful', 'info', {
      contexts: {
        login: {
          username: normalizedUsername,
          role,
          CompId: apiUser.CompId,
        },
      },
    });

    // Emit metrics for successful login
    const loginDuration = performance.now() - loginStartTime;
    Sentry.metrics.count('login_success', 1);
    Sentry.metrics.distribution('login_duration_ms', loginDuration);

    setErrorMessage('');
    setOtpStage(false);
    setOtpCode('');
    setOtpTempToken('');
    setOtpEmail('');
    setOtpPendingUserData(null);
    setOtpSecondsLeft(0);
    setOtpError('');
    setOtpAttempts(0);
    setOtpLockedOut(false);
    setOtpResendCooldown(0);
    setOtpResendMessage('');
    // Pre-load counties lookup data after successful login
    await fetchAreas();
    onLogin(safeUser);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedUsername = username.trim();

    try {
      // Emit metric for login attempt
      Sentry.metrics.count('login_attempts', 1);

      // Try the OTP (2FA) login endpoint first
      const otpLoginResult = await requestOtpLogin(normalizedUsername, password);
      if (otpLoginResult.success && otpLoginResult.data && otpLoginResult.data.status === 'AWAITING_2FA') {
        const otpData = otpLoginResult.data.data || {};
        // Temp-save the full user profile now (featurePermissions, pagePermissions, CompId, etc.)
        // so it can be written to localStorage once the OTP code is verified.
        setOtpPendingUserData(otpData);
        setOtpTempToken(otpData.tempToken || '');
        setOtpEmail(otpData.emailMasked || otpData.email || '');
        setOtpSecondsLeft(Number(otpData.expiresInSeconds) || 300);
        setOtpCode('');
        setOtpError('');
        setOtpAttempts(0);
        setOtpLockedOut(false);
        setOtpResendCooldown(0);
        setOtpResendMessage('');
        setErrorMessage('');
        setOtpStage(true);
        return;
      }

      // Distinguish a server-side/OTP-delivery failure (5xx, or no status info) from
      // genuinely invalid credentials (4xx) so we can show an accurate, safe message —
      // without ever falling back to a non-2FA login path.
      const isServerSideFailure = !otpLoginResult.status || otpLoginResult.status >= 500;

      // Log failed login attempt
      saveLoginAttempt(normalizedUsername, false);

      // Capture failed login attempt in Sentry
      Sentry.captureMessage(
        isServerSideFailure ? 'Login attempt failed - OTP service error' : 'Login attempt failed - invalid credentials',
        'warning',
        {
          contexts: {
            login: {
              username: normalizedUsername,
              attemptedAt: new Date().toISOString(),
              status: otpLoginResult.status,
            },
          },
        },
      );

      // Emit metrics for failed login
      Sentry.metrics.count('login_failure', 1);
      Sentry.metrics.count(isServerSideFailure ? 'otp_service_error' : 'invalid_credentials', 1);

      setErrorMessage(
        isServerSideFailure
          ? 'We could not send your verification code right now. Please try again in a moment.'
          : 'Invalid username or password',
      );
    } catch (error) {
      // Capture login error in Sentry
      Sentry.captureException(error, {
        contexts: {
          login: {
            username: normalizedUsername,
            attemptedAt: new Date().toISOString(),
          },
        },
      });

      // Emit metrics for login error
      Sentry.metrics.count('login_error', 1);
      
      setErrorMessage('An error occurred during login. Please try again.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    await submitOtp(otpCode);
  };

  const submitOtp = async (codeToVerify) => {
    if (otpLockedOut) {
      return;
    }
    setOtpError('');

    if (!/^\d{6}$/.test(codeToVerify)) {
      setOtpError('Enter the 6-digit code sent to your email.');
      return;
    }

    if (otpSecondsLeft <= 0) {
      setOtpError('This code has expired. Please go back and sign in again.');
      return;
    }

    const normalizedUsername = username.trim();
    const loginStartTime = performance.now();

    const verifyResult = await verifyOtp(otpTempToken, codeToVerify);
    const verifyPayload = verifyResult.data || {};
    const isAuthenticated = verifyResult.success && verifyPayload.status === 'AUTHENTICATED';
    if (isAuthenticated) {
      // Use the profile saved from the first login response; the verify-otp step only
      // confirms the code and may return minimal data (status/message), not the full user.
      const apiUser = otpPendingUserData || verifyPayload.data || verifyPayload;
      try {
        await finalizeLogin(apiUser, normalizedUsername, loginStartTime);
      } catch (error) {
        Sentry.captureException(error, {
          contexts: { login: { username: normalizedUsername, stage: 'otp-verify-finalize' } },
        });
        setOtpError('An error occurred completing sign-in. Please try again.');
      }
      return;
    }

    // Generic message on failure to avoid leaking backend details; track attempts client-side
    const nextAttempts = otpAttempts + 1;
    setOtpAttempts(nextAttempts);
    setOtpCode('');

    if (nextAttempts >= MAX_OTP_ATTEMPTS) {
      setOtpLockedOut(true);
      setOtpTempToken('');
      setOtpPendingUserData(null);
      setOtpError('Too many incorrect attempts. Please go back and sign in again.');
      Sentry.captureMessage('OTP verification locked out after max attempts', 'warning', {
        contexts: { login: { username: normalizedUsername } },
      });
      return;
    }

    const remaining = MAX_OTP_ATTEMPTS - nextAttempts;
    setOtpError(`Invalid or expired code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
  };

  // Auto-submit as soon as a full 6-digit code has been entered
  useEffect(() => {
    if (otpStage && otpCode.length === 6 && !otpLoading && !otpLockedOut && otpSecondsLeft > 0) {
      submitOtp(otpCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode]);

  const handleBackToLogin = () => {
    setOtpStage(false);
    setOtpCode('');
    setOtpTempToken('');
    setOtpEmail('');
    setOtpPendingUserData(null);
    setOtpSecondsLeft(0);
    setOtpError('');
    setOtpAttempts(0);
    setOtpLockedOut(false);
    setOtpResendCooldown(0);
    setOtpResendLoading(false);
    setOtpResendMessage('');
  };

  const handleResendOtp = async () => {
    if (otpResendLoading || otpResendCooldown > 0 || !otpTempToken) {
      return;
    }

    setOtpResendLoading(true);
    setOtpResendMessage('');
    setOtpError('');

    const result = await resendOtp(otpTempToken);

    if (result.success) {
      const payload = result.data || {};
      const otpData = payload.data || payload;

      if (otpData.tempToken) {
        setOtpTempToken(otpData.tempToken);
      }
      if (otpData.emailMasked || otpData.email) {
        setOtpEmail(otpData.emailMasked || otpData.email);
      }
      setOtpSecondsLeft(Number(otpData.expiresInSeconds) || 300);
      setOtpCode('');
      setOtpAttempts(0);
      setOtpResendCooldown(30);
      setOtpResendMessage('A new code has been sent to your email.');
      if (otpInputRef.current) {
        otpInputRef.current.focus();
      }
    } else {
      setOtpResendMessage('Could not resend the code. Please try again shortly.');
    }

    setOtpResendLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 120px)',
        display: 'grid',
        placeItems: 'center',
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
        background: `
          radial-gradient(circle at top left, rgba(13, 71, 161, 0.16) 0%, transparent 30%),
          radial-gradient(circle at bottom right, rgba(66, 165, 245, 0.18) 0%, transparent 36%),
          linear-gradient(160deg, #eef5ff 0%, #f8fbff 48%, #edf3fb 100%)
        `,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 1080,
          borderRadius: 6,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.08fr 0.92fr' },
          border: '1px solid',
          borderColor: 'rgba(148, 163, 184, 0.28)',
          boxShadow: '0 28px 80px rgba(15, 23, 42, 0.14)',
          bgcolor: 'background.paper',
          color: 'text.primary',
          backdropFilter: 'blur(10px)',
        }}
        role="region"
        aria-labelledby="login-heading"
      >
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            p: { xs: 3, md: 5 },
            background: 'linear-gradient(155deg, #0b2e6b 0%, #114a9b 45%, #1d79d7 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: { xs: 320, md: 620 },
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 'auto -90px -110px auto',
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: '40px auto auto -70px',
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'inline-flex',
              alignSelf: 'flex-start',
              px: 1.5,
              py: 0.75,
              mb: 2.5,
              borderRadius: 999,
              bgcolor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Secure Access Portal
            </Typography>
          </Box>

          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 500 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.1rem', md: '3.35rem' },
                lineHeight: 1,
                letterSpacing: '-0.04em',
                mb: 1.5,
              }}
            >
              Microfinance Management
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, mb: 2, color: 'rgba(255,255,255,0.96)', lineHeight: 1.25 }}
            >
              Finance operations, member servicing, and approvals in one place.
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.88, maxWidth: 420, lineHeight: 1.8 }}>
              Access the platform to manage daily transactions, user roles, reporting, deposits, and loan workflows with a secure, centralized interface.
            </Typography>
          </Box>

          <Stack
            spacing={1.25}
            sx={{
              position: 'relative',
              zIndex: 1,
              mt: { xs: 4, md: 6 },
              maxWidth: 420,
            }}
          >
            {loginHighlights.map((item) => (
              <Box
                key={item}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.5,
                  py: 1.2,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#b9e6ff',
                    boxShadow: '0 0 0 5px rgba(185,230,255,0.18)',
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ fontWeight: 600, lineHeight: 1.45 }}>{item}</Typography>
              </Box>
            ))}
          </Stack>

          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              mt: { xs: 3, md: 'auto' },
              pt: { xs: 3, md: 5 },
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 1.5,
              maxWidth: 340,
            }}
          >
            <Box sx={{ p: 1.75, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)' }}>
              <Typography sx={{ fontSize: '0.78rem', opacity: 0.76, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Security
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: '1rem', fontWeight: 700 }}>Role-based access</Typography>
            </Box>
            <Box sx={{ p: 1.75, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)' }}>
              <Typography sx={{ fontSize: '0.78rem', opacity: 0.76, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Operations
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: '1rem', fontWeight: 700 }}>Branch-ready workflows</Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            p: { xs: 3, md: 5 },
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,250,255,0.96) 100%)',
          }}
        >
          <Stack component="form" onSubmit={otpStage ? handleVerifyOtp : handleSubmit} noValidate spacing={2.25} sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
            <Box>
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#1565c0',
                  mb: 1,
                }}
              >
                {otpStage ? 'Verify It\u2019s You' : 'Sign In'}
              </Typography>
            </Box>

            {otpStage ? (
              <>
                <Typography
                  id="login-heading"
                  variant="h4"
                  component="h2"
                  sx={{ fontWeight: 800, letterSpacing: '-0.03em' }}
                >
                  Enter verification code
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5, lineHeight: 1.7 }}>
                  We\'ve sent a 6-digit code to <strong>{otpEmail || 'your email'}</strong>. Enter it below to continue.
                </Typography>

                <TextField
                  id="otp-code"
                  label="6-digit code"
                  value={otpCode}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(digitsOnly);
                    if (otpError && !otpLockedOut) {
                      setOtpError('');
                    }
                  }}
                  fullWidth
                  required
                  disabled={otpLockedOut || otpSecondsLeft <= 0}
                  inputRef={otpInputRef}
                  inputProps={{
                    'aria-required': true,
                    inputMode: 'numeric',
                    autoComplete: 'one-time-code',
                    maxLength: 6,
                    style: { letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: 'rgba(247,250,255,0.96)',
                    },
                  }}
                />

                <Typography
                  variant="body2"
                  sx={{
                    textAlign: 'center',
                    fontWeight: 700,
                    color: otpSecondsLeft > 0 ? '#1565c0' : 'error.main',
                  }}
                >
                  {otpSecondsLeft > 0
                    ? `Code expires in ${formatCountdown(otpSecondsLeft)}`
                    : 'Code expired. Please go back and sign in again.'}
                </Typography>

                {otpError && (
                  <Typography
                    variant="body2"
                    color="error"
                    role="alert"
                    sx={{
                      fontWeight: 600,
                      px: 1.5,
                      py: 1.2,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(211, 47, 47, 0.08)',
                      border: '1px solid rgba(211, 47, 47, 0.16)',
                    }}
                  >
                    {otpError}
                  </Typography>
                )}

                {otpResendMessage && !otpError && (
                  <Typography
                    variant="body2"
                    role="status"
                    sx={{
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#1565c0',
                    }}
                  >
                    {otpResendMessage}
                  </Typography>
                )}

                {!otpLockedOut && (
                  <Button
                    type="button"
                    variant="text"
                    fullWidth
                    onClick={handleResendOtp}
                    disabled={otpResendLoading || otpResendCooldown > 0}
                    startIcon={otpResendLoading ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{ fontWeight: 600, textTransform: 'none' }}
                  >
                    {otpResendLoading
                      ? 'Sending...'
                      : otpResendCooldown > 0
                        ? `Resend code (${otpResendCooldown}s)`
                        : 'Resend code'}
                  </Button>
                )}

                {!otpLockedOut && (
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={otpLoading || otpSecondsLeft <= 0 || otpCode.length !== 6}
                    startIcon={otpLoading ? <CircularProgress size={18} color="inherit" /> : null}
                    sx={{
                      mt: 1,
                      py: 1.4,
                      borderRadius: 3,
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '1rem',
                      background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 58%, #42a5f5 100%)',
                      boxShadow: '0 16px 28px rgba(25, 118, 210, 0.24)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0b3f91 0%, #1669c1 58%, #3b98e6 100%)',
                        boxShadow: '0 18px 34px rgba(25, 118, 210, 0.28)',
                      },
                    }}
                  >
                    {otpLoading ? 'Verifying...' : 'Verify Code'}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="text"
                  fullWidth
                  onClick={handleBackToLogin}
                  sx={{ fontWeight: 600, textTransform: 'none' }}
                >
                  Back to login
                </Button>
              </>
            ) : (
              <>
                <Typography
                  id="login-heading"
                  variant="h4"
                  component="h2"
                  sx={{ fontWeight: 800, letterSpacing: '-0.03em' }}
                >
                  Welcome back
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5, lineHeight: 1.7 }}>
                  Enter your credentials to continue to the Microfinance Management workspace.
                </Typography>

                <TextField
                  id="username"
                  label="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) {
                      setErrorMessage('');
                    }
                  }}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FontAwesomeIcon icon={faUser} style={{ color: '#1565c0' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: 'rgba(247,250,255,0.96)',
                    },
                  }}
                  inputProps={{ 'aria-required': true, autoComplete: 'username' }}
                />

                <TextField
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) {
                      setErrorMessage('');
                    }
                  }}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FontAwesomeIcon icon={faLock} style={{ color: '#1565c0' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: 'rgba(247,250,255,0.96)',
                    },
                  }}
                  inputProps={{ 'aria-required': true, autoComplete: 'current-password' }}
                />

                {errorMessage && (
                  <Typography
                    variant="body2"
                    color="error"
                    sx={{
                      fontWeight: 600,
                      px: 1.5,
                      py: 1.2,
                      borderRadius: 2.5,
                      bgcolor: 'rgba(211, 47, 47, 0.08)',
                      border: '1px solid rgba(211, 47, 47, 0.16)',
                    }}
                  >
                    {errorMessage}
                  </Typography>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={otpLoading}
                  startIcon={otpLoading ? <CircularProgress size={18} color="inherit" /> : null}
                  sx={{
                    mt: 1,
                    py: 1.4,
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 58%, #42a5f5 100%)',
                    boxShadow: '0 16px 28px rgba(25, 118, 210, 0.24)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0b3f91 0%, #1669c1 58%, #3b98e6 100%)',
                      boxShadow: '0 18px 34px rgba(25, 118, 210, 0.28)',
                    },
                  }}
                >
                  {otpLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.9rem', pt: 0.5 }}>
                  Secure sign-in for authorized users.
                </Typography>
              </>
            )}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

const LoginFallback = () => (
  <div style={{ textAlign: 'center', padding: '2rem' }}>
    An error occurred on the login page. Please refresh and try again.
  </div>
);

export default Login;
export { LoginFallback };

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

export default function ChangePassword({ user, onPasswordChanged, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);

  const complexityRules = {
    minLength: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };
  const meetsComplexity = Object.values(complexityRules).every(Boolean);

  const renderVisibilityAdornment = (isVisible, toggleVisibility) => (
    <InputAdornment position="end">
      <IconButton
        edge="end"
        onClick={toggleVisibility}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
      >
        {isVisible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
      </IconButton>
    </InputAdornment>
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatusMessage('Please fill in all password fields.');
      setStatusError(true);
      return;
    }

    if (!meetsComplexity) {
      setStatusMessage('New password does not meet the required complexity.');
      setStatusError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage('New password and confirmation do not match.');
      setStatusError(true);
      return;
    }

    if (newPassword === currentPassword) {
      setStatusMessage('New password must be different from current password.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      const response = await fetch('/api/user-setup/password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.username || '',
          currentPassword,
          newPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatusMessage(payload?.message || 'Failed to change password.');
        setStatusError(true);
        return;
      }

      setStatusMessage('Password changed successfully. Redirecting...');
      setStatusError(false);
      onPasswordChanged?.();
    } catch {
      setStatusMessage('Failed to change password.');
      setStatusError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 120px)',
        display: 'grid',
        placeItems: 'center',
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 520, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Change Temporary Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {`Hello ${user?.name || 'User'}, please set your real password before continuing.`}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              InputProps={{
                endAdornment: renderVisibilityAdornment(
                  showCurrentPassword,
                  () => setShowCurrentPassword((prev) => !prev),
                ),
              }}
              required
              fullWidth
            />
            <TextField
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                endAdornment: renderVisibilityAdornment(
                  showNewPassword,
                  () => setShowNewPassword((prev) => !prev),
                ),
              }}
              required
              fullWidth
            />
            <Box sx={{ px: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Password must include:
              </Typography>
              <Typography variant="caption" color={complexityRules.minLength ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
                {`${complexityRules.minLength ? '✓' : '•'} At least 8 characters`}
              </Typography>
              <Typography variant="caption" color={complexityRules.uppercase ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
                {`${complexityRules.uppercase ? '✓' : '•'} At least one uppercase letter`}
              </Typography>
              <Typography variant="caption" color={complexityRules.lowercase ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
                {`${complexityRules.lowercase ? '✓' : '•'} At least one lowercase letter`}
              </Typography>
              <Typography variant="caption" color={complexityRules.number ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
                {`${complexityRules.number ? '✓' : '•'} At least one number`}
              </Typography>
              <Typography variant="caption" color={complexityRules.special ? 'success.main' : 'text.secondary'} sx={{ display: 'block' }}>
                {`${complexityRules.special ? '✓' : '•'} At least one special character`}
              </Typography>
            </Box>
            <TextField
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: renderVisibilityAdornment(
                  showConfirmPassword,
                  () => setShowConfirmPassword((prev) => !prev),
                ),
              }}
              required
              fullWidth
            />

            {statusMessage && (
              <Typography
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: statusError ? 'error.light' : 'success.light',
                  color: statusError ? 'error.dark' : 'success.dark',
                }}
              >
                {statusMessage}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
              <Button type="submit" variant="contained" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Update Password'}
              </Button>
              <Button variant="outlined" color="inherit" onClick={onLogout} disabled={isSaving}>
                Sign Out
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

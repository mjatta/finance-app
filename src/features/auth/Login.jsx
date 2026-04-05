import React, { useState } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import testUsers from '../../data/test-users.json';import { getFullApiUrl } from '../../utils/apiConfig';
const loginHighlights = [
  'Centralized member and loan operations',
  'Role-based access for secure workflows',
  'Fast access to reporting and accounting tools',
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const mapRoleToAccess = (roleRecord) => {
    const permissions = roleRecord?.featurePermissions || {};
    const pagePermissions = roleRecord?.pagePermissions || {};
    const visibleFeatures = Object.entries(permissions)
      .filter(([, permission]) => permission !== 'hide feature')
      .map(([feature]) => feature);

    const hasWritePermission = Object.values(permissions).some((permission) => permission === 'write');

    return {
      allPages: false,
      features: visibleFeatures,
      readOnly: !hasWritePermission && visibleFeatures.length > 0,
      featurePermissions: permissions,
      pagePermissions,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedUsername = username.trim();
    const normalizedLookup = normalizedUsername.toLowerCase();
    const foundDefaultUser = testUsers.users.find(
      (user) => user.username === normalizedUsername && user.password === password,
    );

    if (foundDefaultUser) {
      const { password: _, ...safeUser } = foundDefaultUser;
      setErrorMessage('');
      onLogin(safeUser);
      return;
    }

    try {
      const url = getFullApiUrl('/api/user-setup');
      const response = await fetch(url);
      if (!response.ok) {
        setErrorMessage('Invalid username or password');
        return;
      }

      const payload = await response.json();
      const setupUsers = Array.isArray(payload?.users) ? payload.users : [];
      const setupRoles = Array.isArray(payload?.roles) ? payload.roles : [];

      const foundSetupUser = setupUsers.find((setupUser) => {
        const setupUserId = String(setupUser.userId || '').trim().toLowerCase();
        const setupUserName = String(setupUser.userName || '').trim().toLowerCase();
        const matchesUsername = setupUserId === normalizedLookup || setupUserName === normalizedLookup;
        const matchesPassword = setupUser.temporaryPassword === password || setupUser.password === password;
        return matchesUsername && matchesPassword;
      });

      if (!foundSetupUser || foundSetupUser.disableUser) {
        setErrorMessage('Invalid username or password');
        return;
      }

      const matchedRole = setupRoles.find((role) => role.roleName === foundSetupUser.baseRole);
      const access = {
        ...mapRoleToAccess(matchedRole),
        pagePermissions: {
          ...(matchedRole?.pagePermissions || {}),
          ...(foundSetupUser?.pagePermissions || {}),
        },
      };
      const usedTemporaryPassword = foundSetupUser.temporaryPassword === password;
      const mustChangePassword = foundSetupUser.userId !== 'super.user' && (usedTemporaryPassword || Boolean(foundSetupUser.resetPassword));

      const safeUser = {
        id: foundSetupUser.staffNumber || foundSetupUser.userId,
        name: foundSetupUser.userName,
        username: foundSetupUser.userId,
        role: foundSetupUser.baseRole || 'USER',
        access,
        mustChangePassword,
      };

      setErrorMessage('');
      onLogin(safeUser);
      return;
    } catch {
      setErrorMessage('Invalid username or password');
      return;
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
          <Stack component="form" onSubmit={handleSubmit} noValidate spacing={2.25} sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
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
                Sign In
              </Typography>
            </Box>
            <Typography
              id="login-heading"
              variant="h4"
              component="h2"
              sx={{ fontWeight: 800, letterSpacing: '-0.03em' }}
            >
              Welcome back
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5, lineHeight: 1.7 }}>
              Enter your credentials to continue to the Social Development Fund management workspace.
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
              inputProps={{ 'aria-required': true }}
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
              inputProps={{ 'aria-required': true }}
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
              Sign In
            </Button>

            <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.9rem', pt: 0.5 }}>
              Secure sign-in for authorized Social Development Fund staff.
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

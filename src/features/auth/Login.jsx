import React, { useState } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import testUsers from '../../data/test-users.json';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const mapRoleToAccess = (roleRecord) => {
    const permissions = roleRecord?.featurePermissions || {};
    const visibleFeatures = Object.entries(permissions)
      .filter(([, permission]) => permission !== 'hide feature')
      .map(([feature]) => feature);

    const hasWritePermission = Object.values(permissions).some((permission) => permission === 'write');

    return {
      allPages: false,
      features: visibleFeatures,
      readOnly: !hasWritePermission && visibleFeatures.length > 0,
      featurePermissions: permissions,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedUsername = username.trim();
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
      const response = await fetch('/api/user-setup');
      if (!response.ok) {
        setErrorMessage('Invalid username or password');
        return;
      }

      const payload = await response.json();
      const setupUsers = Array.isArray(payload?.users) ? payload.users : [];
      const setupRoles = Array.isArray(payload?.roles) ? payload.roles : [];

      const foundSetupUser = setupUsers.find((setupUser) => {
        const matchesUsername = setupUser.userId === normalizedUsername;
        const matchesPassword = setupUser.temporaryPassword === password;
        return matchesUsername && matchesPassword;
      });

      if (!foundSetupUser || foundSetupUser.disableUser) {
        setErrorMessage('Invalid username or password');
        return;
      }

      const matchedRole = setupRoles.find((role) => role.roleName === foundSetupUser.baseRole);
      const access = mapRoleToAccess(matchedRole);

      const safeUser = {
        id: foundSetupUser.staffNumber || foundSetupUser.userId,
        name: foundSetupUser.userName,
        username: foundSetupUser.userId,
        role: foundSetupUser.baseRole || 'USER',
        access,
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
        minHeight: 'calc(100vh - 160px)',
        display: 'grid',
        placeItems: 'center',
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
        background: 'radial-gradient(circle at top right, #d8ebff 0%, #f4f8ff 45%, #eef4fb 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 980,
          borderRadius: 4,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 20px 50px rgba(16, 42, 67, 0.14)',
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
        role="region"
        aria-labelledby="login-heading"
      >
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            background: 'linear-gradient(145deg, #0d47a1 0%, #1976d2 65%, #42a5f5 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography variant="overline" sx={{ letterSpacing: 1.4, opacity: 0.9 }}>
            Sacco Management System
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5, lineHeight: 1.2 }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.92, maxWidth: 340 }}>
            Sign in to continue managing members, deposits, loans, accounting, and reports.
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 3, md: 5 }, display: 'flex', alignItems: 'center' }}>
          <Stack component="form" onSubmit={handleSubmit} noValidate spacing={2} sx={{ width: '100%' }}>
            <Typography
              id="login-heading"
              variant="h5"
              component="h2"
              sx={{ fontWeight: 700 }}
            >
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Enter your credentials to access your dashboard.
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
                    <FontAwesomeIcon icon={faUser} />
                  </InputAdornment>
                ),
              }}
              inputProps={{ 'aria-required': true }}
            />

            <TextField
              id="password"
              label="Password"
              type="password"
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
                    <FontAwesomeIcon icon={faLock} />
                  </InputAdornment>
                ),
              }}
              inputProps={{ 'aria-required': true }}
            />

            {errorMessage && (
              <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
                {errorMessage}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 1,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 10px 20px rgba(25, 118, 210, 0.28)',
              }}
            >
              Sign In
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

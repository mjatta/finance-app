import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { getFullApiUrl } from '../../../utils/apiConfig';

export default function UserSecurity({ user }) {
  const [settingsForm, setSettingsForm] = useState({
    passwordComplexity: 'Medium',
    allowConcurrentLogons: false,
    minPasswordLength: '8',
    passwordValidityDays: '90',
    passwordTrials: '3',
    logoutDurationHours: '8',
    biometricFingerprint: false,
    biometricFacialVerification: false,
    mobilePhoneVerification: false,
  });
  const [authoriserForm, setAuthoriserForm] = useState({
    department: '',
    principalAuthoriser: '',
    firstProxy: '',
    secondProxy: '',
  });
  const [authoriserRows, setAuthoriserRows] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingAuthoriser, setIsSavingAuthoriser] = useState(false);

  const isReadOnlyRole = Boolean(user?.access?.readOnly);

  useEffect(() => {
    let isMounted = true;

    const loadSecurityData = async () => {
      try {
        const url = getFullApiUrl('/api/security-settings');
        const response = await fetch(url);
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        if (!isMounted) {
          return;
        }

        if (payload?.settings && typeof payload.settings === 'object') {
          setSettingsForm((prev) => ({ ...prev, ...payload.settings }));
        }

        if (Array.isArray(payload?.departmentAuthorisers)) {
          setAuthoriserRows(payload.departmentAuthorisers);
        }
      } catch {
        // keep defaults if load fails
      }
    };

    loadSecurityData();

    return () => {
      isMounted = false;
    };
  }, []);

  const departmentOptions = useMemo(() => {
    const defaults = ['Loans', 'Member Services', 'Finance', 'Operations', 'IT'];
    const fromRows = authoriserRows
      .map((entry) => entry?.department)
      .filter(Boolean);

    return Array.from(new Set([...defaults, ...fromRows]));
  }, [authoriserRows]);

  const handleSettingsChange = (event) => {
    const { name, value, type, checked } = event.target;
    setStatusMessage('');
    setSettingsForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAuthoriserChange = (event) => {
    const { name, value } = event.target;
    setStatusMessage('');
    setAuthoriserForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSettings = async () => {
    if (isReadOnlyRole) {
      return;
    }

    setIsSavingSettings(true);
    setStatusMessage('');

    try {
      const response = await fetch('/api/security-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: settingsForm,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save security settings.');
      }

      setStatusMessage('Security settings saved successfully.');
      notifySaveSuccess({
        page: 'System Administration / Security',
        action: 'Save Security Settings',
        message: 'Security settings saved successfully.',
      });
    } catch (error) {
      setStatusMessage('Unable to save security settings.');
      notifySaveError({
        page: 'System Administration / Security',
        action: 'Save Security Settings',
        message: 'Unable to save security settings.',
        error,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveAuthoriser = async () => {
    if (isReadOnlyRole) {
      return;
    }

    if (!authoriserForm.department || !authoriserForm.principalAuthoriser) {
      setStatusMessage('Department and Principal Authoriser are required.');
      return;
    }

    setIsSavingAuthoriser(true);
    setStatusMessage('');

    try {
      const url = getFullApiUrl('/api/security-settings');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authoriser: authoriserForm,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save authoriser setup.');
      }

      const payload = await response.json();
      if (Array.isArray(payload?.departmentAuthorisers)) {
        setAuthoriserRows(payload.departmentAuthorisers);
      }

      setStatusMessage('Department authoriser setup saved successfully.');
      setAuthoriserForm({
        department: '',
        principalAuthoriser: '',
        firstProxy: '',
        secondProxy: '',
      });
      notifySaveSuccess({
        page: 'System Administration / Security',
        action: 'Save Department Authoriser',
        message: 'Department authoriser setup saved successfully.',
      });
    } catch (error) {
      setStatusMessage('Unable to save department authoriser setup.');
      notifySaveError({
        page: 'System Administration / Security',
        action: 'Save Department Authoriser',
        message: 'Unable to save department authoriser setup.',
        error,
      });
    } finally {
      setIsSavingAuthoriser(false);
    }
  };

  const handleGridSelect = (row) => {
    setAuthoriserForm({
      department: row.department || '',
      principalAuthoriser: row.principalAuthoriser || '',
      firstProxy: row.firstProxy || '',
      secondProxy: row.secondProxy || '',
    });
    setStatusMessage(`Loaded department setup: ${row.department}`);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        User Security
      </Typography>

      {isReadOnlyRole && (
        <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontWeight: 700 }}>
          Read-only access: you can view security settings, but cannot save changes.
        </Typography>
      )}

      {statusMessage && (
        <Typography
          variant="body2"
          sx={{ mb: 2, fontWeight: 700 }}
          color={statusMessage.toLowerCase().includes('unable') ? 'error.main' : 'success.main'}
        >
          {statusMessage}
        </Typography>
      )}

      <Box
        component="fieldset"
        disabled={isReadOnlyRole}
        sx={{ border: 'none', p: 0, m: 0, opacity: isReadOnlyRole ? 0.55 : 1, pointerEvents: isReadOnlyRole ? 'none' : 'auto' }}
      >
        <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
              Security Settings
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                select
                label="Password complexity levels"
                name="passwordComplexity"
                value={settingsForm.passwordComplexity}
                onChange={handleSettingsChange}
                sx={{ flex: '1 1 260px', minWidth: 240 }}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Very High">Very High</MenuItem>
              </TextField>

              <TextField
                label="Minial password length"
                name="minPasswordLength"
                value={settingsForm.minPasswordLength}
                onChange={handleSettingsChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />

              <TextField
                label="Password validaity (days)"
                name="passwordValidityDays"
                value={settingsForm.passwordValidityDays}
                onChange={handleSettingsChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />

              <TextField
                label="Password trials"
                name="passwordTrials"
                value={settingsForm.passwordTrials}
                onChange={handleSettingsChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />

              <TextField
                label="Logout Duration Hours"
                name="logoutDurationHours"
                value={settingsForm.logoutDurationHours}
                onChange={handleSettingsChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%' }}>
                <FormControlLabel
                  control={(
                    <Checkbox
                      name="allowConcurrentLogons"
                      checked={settingsForm.allowConcurrentLogons}
                      onChange={handleSettingsChange}
                    />
                  )}
                  label="Allow concurrent logons"
                />
              </Box>

              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                  Biomatri Authentication
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={(
                      <Checkbox
                        name="biometricFingerprint"
                        checked={settingsForm.biometricFingerprint}
                        onChange={handleSettingsChange}
                      />
                    )}
                    label="FingerPrints"
                  />
                  <FormControlLabel
                    control={(
                      <Checkbox
                        name="biometricFacialVerification"
                        checked={settingsForm.biometricFacialVerification}
                        onChange={handleSettingsChange}
                      />
                    )}
                    label="Facial verifaitcation"
                  />
                  <FormControlLabel
                    control={(
                      <Checkbox
                        name="mobilePhoneVerification"
                        checked={settingsForm.mobilePhoneVerification}
                        onChange={handleSettingsChange}
                      />
                    )}
                    label="Mobile Phone verification"
                  />
                </Box>
              </Box>

              <Box sx={{ width: '100%' }}>
                <Button variant="contained" onClick={handleSaveSettings} disabled={isSavingSettings}>
                  {isSavingSettings ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
              Department authoriser setup
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                select
                label="Department"
                name="department"
                value={authoriserForm.department}
                onChange={handleAuthoriserChange}
                sx={{ flex: '1 1 260px', minWidth: 240 }}
              >
                {departmentOptions.map((department) => (
                  <MenuItem key={department} value={department}>
                    {department}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Prinincpal Authroiser"
                name="principalAuthoriser"
                value={authoriserForm.principalAuthoriser}
                onChange={handleAuthoriserChange}
                sx={{ flex: '1 1 240px', minWidth: 220 }}
              />
              <TextField
                label="First Proxy"
                name="firstProxy"
                value={authoriserForm.firstProxy}
                onChange={handleAuthoriserChange}
                sx={{ flex: '1 1 240px', minWidth: 220 }}
              />
              <TextField
                label="Second proxy"
                name="secondProxy"
                value={authoriserForm.secondProxy}
                onChange={handleAuthoriserChange}
                sx={{ flex: '1 1 240px', minWidth: 220 }}
              />

              <Box sx={{ width: '100%' }}>
                <Button variant="contained" onClick={handleSaveAuthoriser} disabled={isSavingAuthoriser}>
                  {isSavingAuthoriser ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 340 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Prinincpal Authroiser</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>First Proxy</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Second proxy</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {authoriserRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                    No department authoriser records.
                  </TableCell>
                </TableRow>
              ) : (
                authoriserRows.map((row, index) => (
                  <TableRow
                    key={`${row.department || 'department'}-${index}`}
                    hover
                    onClick={() => handleGridSelect(row)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{row.department || '-'}</TableCell>
                    <TableCell>{row.principalAuthoriser || '-'}</TableCell>
                    <TableCell>{row.firstProxy || '-'}</TableCell>
                    <TableCell>{row.secondProxy || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

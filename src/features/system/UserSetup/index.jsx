import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
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
import { Add as AddIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

export default function UserSetup({ user }) {
  const featureOptions = ['member', 'loan', 'accounting', 'system', 'reporting'];
  const featurePermissionOptions = ['read', 'write', 'view only', 'hide feature'];
  const [companies, setCompanies] = useState(['Microfinance Management']);
  const [branches, setBranches] = useState(['Main Branch']);
  const [companyBranches, setCompanyBranches] = useState([
    { companyName: 'Microfinance Management', branchName: 'Main Branch' },
  ]);
  const [baseRoles, setBaseRoles] = useState(['Admin', 'Supervisor', 'Officer']);
  const [savedUsers, setSavedUsers] = useState([]);
  const [savedRoles, setSavedRoles] = useState([]);
  const [showSavedRoles, setShowSavedRoles] = useState(false);
  const [showSavedUsers, setShowSavedUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState('');
  const [editingRoleName, setEditingRoleName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const [userForm, setUserForm] = useState({
    companyName: '',
    branch: '',
    staffNumber: '',
    userId: '',
    userName: '',
    temporaryPassword: '',
    baseRole: '',
    cashAccount: '',
    userType: '',
    debitMit: '',
    creditLimit: '',
    loanApprovalLimit: false,
    disableUser: false,
    resetPassword: false,
  });

  const [roleForm, setRoleForm] = useState({
    roleName: '',
    roleDescription: '',
    featurePermissions: {
      member: 'hide feature',
      loan: 'hide feature',
      accounting: 'hide feature',
      system: 'hide feature',
      reporting: 'hide feature',
    },
  });
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [branchDialogForm, setBranchDialogForm] = useState({
    companyName: '',
    branchName: '',
  });

  const isReadOnlyRole = Boolean(user?.access?.readOnly);

  const canSave = useMemo(
    () => userForm.companyName && userForm.branch && userForm.userId && userForm.userName && userForm.baseRole,
    [userForm],
  );
  const canSaveRole = useMemo(
    () => roleForm.roleName.trim().length > 0,
    [roleForm],
  );
  const availableBranches = useMemo(() => {
    const selectedCompany = userForm.companyName;
    if (!selectedCompany) {
      return branches;
    }

    const linkedBranches = companyBranches
      .filter((item) => item.companyName === selectedCompany)
      .map((item) => item.branchName);

    return Array.from(new Set(linkedBranches));
  }, [branches, companyBranches, userForm.companyName]);

  useEffect(() => {
    let isMounted = true;

    const loadSetupData = async () => {
      try {
        const response = await fetch('/api/user-setup');
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        if (!isMounted) {
          return;
        }

        if (Array.isArray(payload?.companies) && payload.companies.length > 0) {
          setCompanies(payload.companies);
          setUserForm((prev) => ({ ...prev, companyName: prev.companyName || payload.companies[0] }));
        }

        if (Array.isArray(payload?.branches) && payload.branches.length > 0) {
          setBranches(payload.branches);
          setUserForm((prev) => ({ ...prev, branch: prev.branch || payload.branches[0] }));
        }

        if (Array.isArray(payload?.companyBranches) && payload.companyBranches.length > 0) {
          setCompanyBranches(payload.companyBranches);
        }

        if (Array.isArray(payload?.users)) {
          setSavedUsers(payload.users);
        }

        if (Array.isArray(payload?.roles) && payload.roles.length > 0) {
          setSavedRoles(payload.roles);
          const roleNames = payload.roles
            .map((role) => role?.roleName)
            .filter(Boolean);
          if (roleNames.length > 0) {
            setBaseRoles((prev) => Array.from(new Set([...prev, ...roleNames])));
          }
        } else {
          setSavedRoles([]);
        }
      } catch {
        // keep defaults if loading fails
      }
    };

    loadSetupData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userForm.companyName) {
      return;
    }

    if (availableBranches.length === 0) {
      setUserForm((prev) => ({ ...prev, branch: '' }));
      return;
    }

    if (!availableBranches.includes(userForm.branch)) {
      setUserForm((prev) => ({ ...prev, branch: availableBranches[0] }));
    }
  }, [availableBranches, userForm.companyName, userForm.branch]);

  const handleAddOption = (type) => {
    if (type === 'branch') {
      setBranchDialogForm({
        companyName: userForm.companyName || companies[0] || '',
        branchName: '',
      });
      setIsBranchDialogOpen(true);
      return;
    }

    const label = type === 'company' ? 'company name' : 'branch name';
    const value = window.prompt(`Enter ${label}`);
    setStatusMessage('');
    if (!value) {
      return;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }

    if (type === 'company') {
      setCompanies((prev) => {
        if (prev.includes(trimmedValue)) {
          return prev;
        }
        return [...prev, trimmedValue];
      });
      setUserForm((prev) => ({ ...prev, companyName: trimmedValue }));
      return;
    }

  };

  const handleCreateBranch = () => {
    const companyName = branchDialogForm.companyName.trim();
    const branchName = branchDialogForm.branchName.trim();

    if (!companyName || !branchName) {
      return;
    }

    setStatusMessage('');
    setCompanyBranches((prev) => {
      const exists = prev.some((item) => item.companyName === companyName && item.branchName === branchName);
      if (exists) {
        return prev;
      }
      return [...prev, { companyName, branchName }];
    });
    setBranches((prev) => (prev.includes(branchName) ? prev : [...prev, branchName]));
    setUserForm((prev) => ({ ...prev, companyName, branch: branchName }));
    setIsBranchDialogOpen(false);
  };

  const handleUserFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setStatusMessage('');
    setUserForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRoleFormChange = (event) => {
    const { name, value } = event.target;
    setStatusMessage('');
    setRoleForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFeaturePermissionChange = (feature, permission) => {
    setStatusMessage('');
    setRoleForm((prev) => {
      return {
        ...prev,
        featurePermissions: {
          ...(prev.featurePermissions || {}),
          [feature]: permission,
        },
      };
    });
  };

  const handleEditSavedRole = (roleRecord) => {
    const defaultPermissions = {
      member: 'hide feature',
      loan: 'hide feature',
      accounting: 'hide feature',
      system: 'hide feature',
      reporting: 'hide feature',
    };

    setRoleForm({
      roleName: roleRecord?.roleName || '',
      roleDescription: roleRecord?.roleDescription || '',
      featurePermissions: {
        ...defaultPermissions,
        ...(roleRecord?.featurePermissions || {}),
      },
    });
    setEditingRoleName(roleRecord?.roleName || '');
    setStatusMessage(`Editing role: ${roleRecord?.roleName || '-'}`);
  };

  const handleEditSavedUser = (userRecord) => {
    setUserForm({
      companyName: userRecord?.companyName || '',
      branch: userRecord?.branch || '',
      staffNumber: userRecord?.staffNumber || '',
      userId: userRecord?.userId || '',
      userName: userRecord?.userName || '',
      temporaryPassword: userRecord?.temporaryPassword || '',
      baseRole: userRecord?.baseRole || '',
      cashAccount: userRecord?.cashAccount || '',
      userType: userRecord?.userType || '',
      debitMit: userRecord?.debitMit || '',
      creditLimit: userRecord?.creditLimit || '',
      loanApprovalLimit: Boolean(userRecord?.loanApprovalLimit),
      disableUser: Boolean(userRecord?.disableUser),
      resetPassword: Boolean(userRecord?.resetPassword),
    });

    if (userRecord?.companyName) {
      setCompanies((prev) => (prev.includes(userRecord.companyName) ? prev : [...prev, userRecord.companyName]));
    }
    if (userRecord?.branch) {
      setBranches((prev) => (prev.includes(userRecord.branch) ? prev : [...prev, userRecord.branch]));
      if (userRecord?.companyName) {
        setCompanyBranches((prev) => {
          const exists = prev.some((item) => item.companyName === userRecord.companyName && item.branchName === userRecord.branch);
          if (exists) {
            return prev;
          }
          return [...prev, { companyName: userRecord.companyName, branchName: userRecord.branch }];
        });
      }
    }

    setEditingUserId(userRecord?.userId || '');
    setStatusMessage(`Editing user: ${userRecord?.userName || userRecord?.userId || '-'}`);
  };

  const handleSaveUser = async () => {
    if (!canSave || isReadOnlyRole) {
      if (!userForm.baseRole) {
        setStatusMessage('Please assign a role before saving the user.');
      }
      return;
    }

    setIsSavingUser(true);
    setStatusMessage('');

    try {
      const response = await fetch('/api/user-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companies,
          branches,
          companyBranches,
          user: {
            ...userForm,
            createdAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save user setup.');
      }

      const payload = await response.json();

      if (Array.isArray(payload?.users)) {
        setSavedUsers(payload.users);
      }

      if (Array.isArray(payload?.companies) && payload.companies.length > 0) {
        setCompanies(payload.companies);
      }

      if (Array.isArray(payload?.branches) && payload.branches.length > 0) {
        setBranches(payload.branches);
      }

      if (Array.isArray(payload?.companyBranches)) {
        setCompanyBranches(payload.companyBranches);
      }

      if (Array.isArray(payload?.roles)) {
        setSavedRoles(payload.roles);
      }

      setStatusMessage('User setup saved successfully.');
      setEditingUserId(userForm.userId || '');
      setUserForm((prev) => ({
        ...prev,
        staffNumber: '',
        userId: '',
        userName: '',
        temporaryPassword: '',
        cashAccount: '',
        userType: '',
        debitMit: '',
        creditLimit: '',
        loanApprovalLimit: false,
        disableUser: false,
        resetPassword: false,
      }));
      setEditingUserId('');
    } catch {
      setStatusMessage('Unable to save user setup data.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleSaveRole = async () => {
    if (!canSaveRole || isReadOnlyRole) {
      return;
    }

    setIsSavingRole(true);
    setStatusMessage('');

    try {
      const rolePayload = {
        roleName: roleForm.roleName.trim(),
        roleDescription: roleForm.roleDescription.trim(),
        featurePermissions: roleForm.featurePermissions || {},
      };

      const response = await fetch('/api/user-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: rolePayload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save role setup.');
      }

      const payload = await response.json();
      if (Array.isArray(payload?.roles)) {
        setSavedRoles(payload.roles);
      }

      setBaseRoles((prev) => Array.from(new Set([...prev, rolePayload.roleName])));
      setEditingRoleName(rolePayload.roleName);
      setRoleForm({
        roleName: '',
        roleDescription: '',
        featurePermissions: {
          member: 'hide feature',
          loan: 'hide feature',
          accounting: 'hide feature',
          system: 'hide feature',
          reporting: 'hide feature',
        },
      });
      setEditingRoleName('');
      setStatusMessage('User role saved successfully.');
    } catch {
      setStatusMessage('Unable to save user role data.');
    } finally {
      setIsSavingRole(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        User Setup
      </Typography>

      {isReadOnlyRole && (
        <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontWeight: 700 }}>
          Read-only access: you can view fields, but cannot save user setup.
        </Typography>
      )}

      {statusMessage && (
        <Typography
          variant="body2"
          color={statusMessage.startsWith('Unable') ? 'error.main' : 'success.main'}
          sx={{ mb: 2, fontWeight: 700 }}
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
              USER SETUP
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                '& .MuiInputLabel-root': {
                  fontWeight: 700,
                },
                '& .MuiFormControlLabel-label': {
                  fontWeight: 700,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 320px', minWidth: 260 }}>
                <TextField
                  select
                  label="Compay name"
                  name="companyName"
                  value={userForm.companyName}
                  onChange={handleUserFormChange}
                  sx={{ flex: 1 }}
                >
                  {companies.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton aria-label="add company" onClick={() => handleAddOption('company')}>
                  <AddIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 320px', minWidth: 260 }}>
                <TextField
                  select
                  label="Branch"
                  name="branch"
                  value={userForm.branch}
                  onChange={handleUserFormChange}
                  sx={{ flex: 1 }}
                >
                  {availableBranches.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton aria-label="add branch" onClick={() => handleAddOption('branch')}>
                  <AddIcon />
                </IconButton>
              </Box>

              <TextField
                label="Staff number"
                name="staffNumber"
                value={userForm.staffNumber}
                onChange={handleUserFormChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />
              <TextField
                label="User id"
                name="userId"
                value={userForm.userId}
                onChange={handleUserFormChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />
              <TextField
                label="User name"
                name="userName"
                value={userForm.userName}
                onChange={handleUserFormChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />
              <TextField
                label="Temporay password"
                name="temporaryPassword"
                value={userForm.temporaryPassword}
                onChange={handleUserFormChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />
              <TextField
                select
                label="Assign role"
                name="baseRole"
                value={userForm.baseRole}
                onChange={handleUserFormChange}
                required
                helperText={!userForm.baseRole ? 'Role is required for new user setup' : 'Selected role determines user permissions'}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              >
                {baseRoles.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Cash account"
                name="cashAccount"
                value={userForm.cashAccount}
                onChange={handleUserFormChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />
              <TextField
                select
                label="User type"
                name="userType"
                value={userForm.userType}
                onChange={handleUserFormChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              >
                <MenuItem value="maker">Maker</MenuItem>
                <MenuItem value="checker">Checker</MenuItem>
                <MenuItem value="approver">Approver</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </TextField>
              <TextField
                label="Debit mit"
                name="debitMit"
                value={userForm.debitMit}
                onChange={handleUserFormChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />
              <TextField
                label="Credit limit"
                name="creditLimit"
                value={userForm.creditLimit}
                onChange={handleUserFormChange}
                sx={{ flex: '1 1 220px', minWidth: 220 }}
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%' }}>
                <FormControlLabel
                  control={<Checkbox name="loanApprovalLimit" checked={userForm.loanApprovalLimit} onChange={handleUserFormChange} />}
                  label="Loan approval limit"
                />
                <FormControlLabel
                  control={<Checkbox name="disableUser" checked={userForm.disableUser} onChange={handleUserFormChange} />}
                  label="Disable user"
                />
                <FormControlLabel
                  control={<Checkbox name="resetPassword" checked={userForm.resetPassword} onChange={handleUserFormChange} />}
                  label="Reset password"
                />
              </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSaveUser}
                disabled={!canSave || isSavingUser}
              >
                {isSavingUser ? 'Saving...' : editingUserId ? 'Update user setup' : 'Save user setup'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
              CREATE USER ROLES
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Role name"
                name="roleName"
                value={roleForm.roleName}
                onChange={handleRoleFormChange}
                sx={{ flex: '1 1 240px', minWidth: 220 }}
              />
              <TextField
                label="Role description"
                name="roleDescription"
                value={roleForm.roleDescription}
                onChange={handleRoleFormChange}
                sx={{ flex: '1 1 320px', minWidth: 260 }}
              />
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                  Feature permissions
                </Typography>
                <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                  {featureOptions.map((feature) => (
                    <TextField
                      key={feature}
                      select
                      size="small"
                      label={feature.charAt(0).toUpperCase() + feature.slice(1)}
                      value={roleForm.featurePermissions?.[feature] || 'hide feature'}
                      onChange={(e) => handleFeaturePermissionChange(feature, e.target.value)}
                    >
                      {featurePermissionOptions.map((permission) => (
                        <MenuItem key={permission} value={permission}>
                          {permission.charAt(0).toUpperCase() + permission.slice(1)}
                        </MenuItem>
                      ))}
                    </TextField>
                  ))}
                </Box>
              </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSaveRole}
                disabled={!canSaveRole || isSavingRole}
              >
                {isSavingRole ? 'Saving...' : editingRoleName ? 'Update user role' : 'Save user role'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Dialog open={isBranchDialogOpen} onClose={() => setIsBranchDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Add new branch</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                select
                label="Company"
                value={branchDialogForm.companyName}
                onChange={(e) => setBranchDialogForm((prev) => ({ ...prev, companyName: e.target.value }))}
              >
                {companies.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Branch name"
                value={branchDialogForm.branchName}
                onChange={(e) => setBranchDialogForm((prev) => ({ ...prev, branchName: e.target.value }))}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsBranchDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateBranch}>
              Add branch
            </Button>
          </DialogActions>
        </Dialog>

        <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box
              onClick={() => setShowSavedRoles((prev) => !prev)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: showSavedRoles ? 1.5 : 0,
                cursor: 'pointer',
                borderRadius: 1,
                px: 0.5,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Saved user roles
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {showSavedRoles ? 'Collapse' : 'Expand'}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSavedRoles((prev) => !prev);
                  }}
                >
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{ transform: showSavedRoles ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                  />
                </IconButton>
              </Box>
            </Box>
            {showSavedRoles && (
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 220 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Role name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Role description</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Feature permissions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {savedRoles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                            No roles saved.
                          </TableCell>
                        </TableRow>
                      ) : (
                        savedRoles.map((item, index) => (
                          <TableRow
                            key={`${item.roleName || 'role'}-${index}`}
                            hover
                            onClick={() => handleEditSavedRole(item)}
                            sx={{
                              cursor: 'pointer',
                              bgcolor: editingRoleName && editingRoleName === item.roleName ? 'primary.50' : 'inherit',
                            }}
                          >
                            <TableCell>{item.roleName || '-'}</TableCell>
                            <TableCell>{item.roleDescription || '-'}</TableCell>
                            <TableCell>
                              {item.featurePermissions && typeof item.featurePermissions === 'object'
                                ? featureOptions
                                    .map((feature) => `${feature}: ${item.featurePermissions[feature] || 'hide feature'}`)
                                    .join(' | ')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </CardContent>
        </Card>

        <Card sx={{ mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box
              onClick={() => setShowSavedUsers((prev) => !prev)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: showSavedUsers ? 2 : 0,
                cursor: 'pointer',
                borderRadius: 1,
                px: 0.5,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                SAVED USERS
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {showSavedUsers ? 'Collapse' : 'Expand'}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSavedUsers((prev) => !prev);
                  }}
                >
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{ transform: showSavedUsers ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                  />
                </IconButton>
              </Box>
            </Box>
            {showSavedUsers && (
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 360 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>COMPANY</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>BRANCH</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>STAFF NUMBER</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>USER ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>USER NAME</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>ASSIGNED ROLE</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>USER TYPE</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {savedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                            NO USERS SAVED.
                          </TableCell>
                        </TableRow>
                      ) : (
                        savedUsers.map((item, index) => (
                          <TableRow
                            key={`${item.userId || 'user'}-${index}`}
                            hover
                            onClick={() => handleEditSavedUser(item)}
                            sx={{
                              cursor: 'pointer',
                              bgcolor: editingUserId && editingUserId === item.userId ? 'primary.50' : 'inherit',
                            }}
                          >
                            <TableCell>{item.companyName || '-'}</TableCell>
                            <TableCell>{item.branch || '-'}</TableCell>
                            <TableCell>{item.staffNumber || '-'}</TableCell>
                            <TableCell>{item.userId || '-'}</TableCell>
                            <TableCell>{item.userName || '-'}</TableCell>
                            <TableCell>{item.baseRole || '-'}</TableCell>
                            <TableCell>{item.userType || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

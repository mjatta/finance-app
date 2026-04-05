import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { getFullApiUrl } from '../../../utils/apiConfig';

const BRANCHES_CACHE_KEY = 'userSetup_remoteBranches';
const SETUP_CACHE_KEY = 'userSetup_setupPayload';

const featureOptions = ['member', 'loan', 'accounting', 'processing', 'system', 'reporting'];
const featurePermissionOptions = ['write', 'view only', 'hide feature'];
const pagePermissionOptions = ['inherit', 'write', 'view only', 'hide page'];

const defaultFeaturePermissions = {
  member: 'hide feature',
  loan: 'hide feature',
  accounting: 'hide feature',
  processing: 'hide feature',
  system: 'hide feature',
  reporting: 'hide feature',
};

const featurePageMap = {
  member: [
    { path: '/member/customer-registration', label: 'Registration' },
    { path: '/member/member-activation', label: 'Account Activation' },
    { path: '/member/add-member-account', label: 'Add Member Account' },
    { path: '/member/member-activate', label: 'Member Activate' },
    { path: '/member/deposits', label: 'Deposits' },
    { path: '/member/account-enquiries', label: 'Account Enquiries' },
    { path: '/member/member-close-account', label: 'Member Close' },
    { path: '/member/withdrawal', label: 'Withdrawal' },
    { path: '/member/transfer', label: 'Member Transfer' },
    { path: '/member/member-payroll-management', label: 'Member Payroll Management' },
    { path: '/member/reprint', label: 'Reprint' },
    { path: '/member/member-close', label: 'Account Closure' },
  ],
  loan: [
    { path: '/loan/application', label: 'Loan Application' },
    { path: '/loan/guarantor', label: 'Loan Guarantor' },
    { path: '/loan/amortization', label: 'Loan Amortization' },
    { path: '/loan/approval', label: 'Loan Approval' },
    { path: '/loan/activate', label: 'Loan Activate' },
    { path: '/loan/disbursement', label: 'Loan Disbursement' },
    { path: '/loan/repayments', label: 'Loan Repayments' },
    { path: '/loan/application-reschedule', label: 'Loan Application Reschedule' },
    { path: '/loan/application-top-up', label: 'Loan Application Top Up' },
    { path: '/loan/change-off', label: 'Loan Change Off' },
    { path: '/loan/recovery', label: 'Recovery/Write-off' },
    { path: '/loan/reporting', label: 'Loan Reporting' },
  ],
  accounting: [
    { path: '/accounting/cash-manager', label: 'Cash Manager' },
    { path: '/accounting/journals', label: 'Journals' },
    { path: '/accounting/transaction-update', label: 'Transaction Update' },
    { path: '/accounting/transaction-reversal-adjustment', label: 'Transaction Reversal / Adjustment' },
    { path: '/accounting/account-enquiry', label: 'Account Enquiry' },
    { path: '/accounting/general-ledger', label: 'General Ledger' },
    { path: '/accounting/account-reconciliation', label: 'Account Reconciliation' },
  ],
  processing: [
    { path: '/processing/subscription', label: 'Periodic Subscription Processing' },
    { path: '/processing/interest', label: 'Interest Calculation' },
    { path: '/processing/period-dues', label: 'Period Processing Period Dues' },
  ],
  system: [
    { path: '/system/product', label: 'Product Setup' },
    { path: '/system/user-setup', label: 'User Setup' },
    { path: '/system/access-control-groups', label: 'Access Control Groups' },
    { path: '/system/security', label: 'Security' },
    { path: '/system/save-logs', label: 'Save Logs' },
    { path: '/system/running-balance-fix', label: 'Running Balance Fix' },
    { path: '/system/end-of-year', label: 'End of Year' },
  ],
  reporting: [
    { path: '/reporting', label: 'Reporting' },
    { path: '/reporting/analytics', label: 'Analytics' },
  ],
};

export default function UserSetup({ user }) {
  const [companies, setCompanies] = useState(['Social Development Fund']);
  const [branches, setBranches] = useState([]);
  const [companyBranches, setCompanyBranches] = useState([]);
  const [remoteBranchesLoaded, setRemoteBranchesLoaded] = useState(false);
  const [baseRoles, setBaseRoles] = useState(['Admin', 'Supervisor', 'Officer']);
  const [savedUsers, setSavedUsers] = useState([]);
  const [savedRoles, setSavedRoles] = useState([]);
  const [showCreateUserRoles, setShowCreateUserRoles] = useState(false);
  const [showSavedRoles, setShowSavedRoles] = useState(false);
  const [showSavedUsers, setShowSavedUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState('');
  const [editingRoleName, setEditingRoleName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const [userForm, setUserForm] = useState({
    companyName: 'Social Development Fund',
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
    featurePermissions: defaultFeaturePermissions,
    pagePermissions: {},
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
    if (remoteBranchesLoaded) return branches;
    if (!userForm.companyName) return branches;

    const linkedBranches = companyBranches
      .filter((item) => item.companyName === userForm.companyName)
      .map((item) => item.branchName);

    return Array.from(new Set(linkedBranches));
  }, [branches, companyBranches, userForm.companyName, remoteBranchesLoaded]);

  useEffect(() => {
    let isMounted = true;

    const applyRemoteBranches = (remoteBranches) => {
      if (!isMounted || remoteBranches.length === 0) return;
      setBranches(remoteBranches);
      setRemoteBranchesLoaded(true);
      setUserForm((prev) => ({
        ...prev,
        branch: prev.branch && remoteBranches.includes(prev.branch) ? prev.branch : '',
      }));
    };

    const applySetupPayload = (payload) => {
      if (!isMounted) return;
      if (Array.isArray(payload?.companies) && payload.companies.length > 0) {
        setCompanies(payload.companies);
        setUserForm((prev) => ({ ...prev, companyName: prev.companyName || payload.companies[0] }));
      }
      if (Array.isArray(payload?.companyBranches) && payload.companyBranches.length > 0) {
        setCompanyBranches(payload.companyBranches);
      }
      if (Array.isArray(payload?.users)) setSavedUsers(payload.users);
      if (Array.isArray(payload?.roles) && payload.roles.length > 0) {
        setSavedRoles(payload.roles);
        const roleNames = payload.roles.map((role) => role?.roleName).filter(Boolean);
        if (roleNames.length > 0) {
          setBaseRoles((prev) => Array.from(new Set([...prev, ...roleNames])));
        }
      } else {
        setSavedRoles([]);
      }
    };

    // Apply cached data immediately to avoid visible delay
    try {
      const cachedBranches = localStorage.getItem(BRANCHES_CACHE_KEY);
      if (cachedBranches) {
        const parsed = JSON.parse(cachedBranches);
        if (Array.isArray(parsed) && parsed.length > 0) applyRemoteBranches(parsed);
      }
      const cachedSetup = localStorage.getItem(SETUP_CACHE_KEY);
      if (cachedSetup) applySetupPayload(JSON.parse(cachedSetup));
    } catch {
      // ignore corrupted cache
    }

    const loadSetupData = async () => {
      try {
        try {
          const url = getFullApiUrl('/api/remote-branches/branches');
          const remoteResp = await fetch(url);
          if (remoteResp.ok) {
            const remoteJson = await remoteResp.json();
            if (Array.isArray(remoteJson) && remoteJson.length > 0) {
              const remoteBranches = Array.from(
                new Set(
                  remoteJson
                    .map((b) => (b?.br_name || b?.branchName || b?.name || '').toString().trim())
                    .filter(Boolean),
                ),
              );
              if (remoteBranches.length > 0) {
                try { localStorage.setItem(BRANCHES_CACHE_KEY, JSON.stringify(remoteBranches)); } catch { /* quota */ }
                applyRemoteBranches(remoteBranches);
              }
            }
          }
        } catch {
          // remote lookup failed — cached data already applied
        }

        const url = getFullApiUrl('/api/user-setup');
        const response = await fetch(url);
        if (!response.ok) return;

        const payload = await response.json();
        try { localStorage.setItem(SETUP_CACHE_KEY, JSON.stringify(payload)); } catch { /* quota */ }
        applySetupPayload(payload);
      } catch {
        // keep existing state if refresh fails
      }
    };

    loadSetupData();

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!userForm.companyName) return;

    if (availableBranches.length === 0) {
      setUserForm((prev) => ({ ...prev, branch: '' }));
      return;
    }

    if (userForm.branch && !availableBranches.includes(userForm.branch)) {
      setUserForm((prev) => ({ ...prev, branch: availableBranches[0] }));
    }
  }, [availableBranches, userForm.companyName, userForm.branch]);

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
    setRoleForm((prev) => ({ ...prev, [name]: value }));
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

  const handlePagePermissionChange = (pagePath, permission) => {
    setStatusMessage('');
    setRoleForm((prev) => {
      const currentPagePermissions = { ...(prev.pagePermissions || {}) };
      if (permission === 'inherit') {
        delete currentPagePermissions[pagePath];
      } else {
        currentPagePermissions[pagePath] = permission;
      }
      return { ...prev, pagePermissions: currentPagePermissions };
    });
  };

  const handleEditSavedRole = (roleRecord) => {
    setRoleForm({
      roleName: roleRecord?.roleName || '',
      roleDescription: roleRecord?.roleDescription || '',
      featurePermissions: { ...defaultFeaturePermissions, ...(roleRecord?.featurePermissions || {}) },
      pagePermissions: { ...(roleRecord?.pagePermissions || {}) },
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
      if (!remoteBranchesLoaded) {
        setBranches((prev) => (prev.includes(userRecord.branch) ? prev : [...prev, userRecord.branch]));
      }
      if (userRecord?.companyName) {
        setCompanyBranches((prev) => {
          const exists = prev.some(
            (item) => item.companyName === userRecord.companyName && item.branchName === userRecord.branch,
          );
          return exists ? prev : [...prev, { companyName: userRecord.companyName, branchName: userRecord.branch }];
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
      const url = getFullApiUrl('/api/user-setup');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companies,
          branches,
          companyBranches,
          user: { ...userForm, createdAt: new Date().toISOString() },
        }),
      });

      if (!response.ok) throw new Error('Failed to save user setup.');

      const payload = await response.json();

      if (Array.isArray(payload?.users)) setSavedUsers(payload.users);
      if (Array.isArray(payload?.companies) && payload.companies.length > 0) setCompanies(payload.companies);
      if (Array.isArray(payload?.branches) && payload.branches.length > 0) setBranches(payload.branches);
      if (Array.isArray(payload?.companyBranches)) setCompanyBranches(payload.companyBranches);
      if (Array.isArray(payload?.roles)) setSavedRoles(payload.roles);

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
      notifySaveSuccess({
        page: 'System Administration / User Setup',
        action: 'Save User Setup',
        message: 'User setup saved successfully.',
      });
    } catch (error) {
      setStatusMessage('Unable to save user setup data.');
      notifySaveError({
        page: 'System Administration / User Setup',
        action: 'Save User Setup',
        message: 'Unable to save user setup data.',
        error,
      });
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
        pagePermissions: roleForm.pagePermissions || {},
      };

      const url = getFullApiUrl('/api/user-setup');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: rolePayload }),
      });

      if (!response.ok) throw new Error('Failed to save role setup.');

      const payload = await response.json();
      if (Array.isArray(payload?.roles)) {
        setSavedRoles(payload.roles);
      }

      setBaseRoles((prev) => Array.from(new Set([...prev, rolePayload.roleName])));
      setEditingRoleName(rolePayload.roleName);
      setRoleForm({
        roleName: '',
        roleDescription: '',
        featurePermissions: defaultFeaturePermissions,
        pagePermissions: {},
      });
      setEditingRoleName('');
      setStatusMessage('User role saved successfully.');
      notifySaveSuccess({
        page: 'System Administration / User Setup',
        action: 'Save User Role',
        message: 'User role saved successfully.',
      });
    } catch (error) {
      setStatusMessage('Unable to save user role data.');
      notifySaveError({
        page: 'System Administration / User Setup',
        action: 'Save User Role',
        message: 'Unable to save user role data.',
        error,
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  const savedRoleColumns = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'roleName', headerName: 'Role name', width: 140, flex: 0.8 },
      { field: 'roleDescription', headerName: 'Role description', width: 160, flex: 0.9 },
      {
        field: 'featurePermissions',
        headerName: 'Feature permissions',
        width: 200,
        flex: 1,
        valueFormatter: (value) => {
          if (value && typeof value === 'object') {
            return featureOptions
              .map((feature) => `${feature}: ${value[feature] || 'hide feature'}`)
              .join(' | ');
          }
          return '-';
        },
      },
      {
        field: 'pagePermissions',
        headerName: 'Page permissions',
        width: 200,
        flex: 1,
        valueFormatter: (value) => {
          if (value && typeof value === 'object' && Object.keys(value).length > 0) {
            return Object.entries(value)
              .map(([page, permission]) => `${page}: ${permission}`)
              .join(' | ');
          }
          return 'Inherit from feature';
        },
      },
    ],
    [],
  );

  const savedRoleRows = useMemo(
    () =>
      savedRoles.map((item, idx) => ({
        id: `role-${idx}`,
        roleName: item.roleName || '-',
        roleDescription: item.roleDescription || '-',
        featurePermissions: item.featurePermissions,
        pagePermissions: item.pagePermissions,
        _originalData: item,
      })),
    [savedRoles],
  );

  const savedUserColumns = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'companyName', headerName: 'Company', width: 130, flex: 0.7 },
      { field: 'branch', headerName: 'Branch', width: 120, flex: 0.6 },
      { field: 'staffNumber', headerName: 'Staff Number', width: 120, flex: 0.6 },
      { field: 'userId', headerName: 'User ID', width: 120, flex: 0.6 },
      { field: 'userName', headerName: 'User Name', width: 130, flex: 0.7 },
      { field: 'baseRole', headerName: 'Assigned Role', width: 130, flex: 0.7 },
      { field: 'userType', headerName: 'User Type', width: 120, flex: 0.6 },
    ],
    [],
  );

  const savedUserRows = useMemo(
    () =>
      savedUsers.map((item, idx) => ({
        id: `user-${idx}`,
        companyName: item.companyName || '-',
        branch: item.branch || '-',
        staffNumber: item.staffNumber || '-',
        userId: item.userId || '-',
        userName: item.userName || '-',
        baseRole: item.baseRole || '-',
        userType: item.userType || '-',
        _originalData: item,
      })),
    [savedUsers],
  );

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
        {...(isReadOnlyRole ? { inert: '' } : {})}
        sx={{ p: 0, m: 0, opacity: isReadOnlyRole ? 0.55 : 1 }}
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
              <TextField
                select
                label="Company name"
                name="companyName"
                value={userForm.companyName}
                onChange={handleUserFormChange}
                disabled
                sx={{ flex: '1 1 320px', minWidth: 260 }}
              >
                {companies.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Branch"
                name="branch"
                value={userForm.branch}
                onChange={handleUserFormChange}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => selected || 'Select a Branch',
                }}
                sx={{ flex: '1 1 320px', minWidth: 260 }}
              >
                <MenuItem value="" disabled>
                  Select a Branch
                </MenuItem>
                {availableBranches.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>

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
                label="Temporary password"
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

        <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: editingRoleName ? 'warning.main' : 'divider', bgcolor: editingRoleName ? 'rgba(255, 193, 7, 0.05)' : 'transparent' }}>
          <CardContent>
            <Box
              onClick={() => setShowCreateUserRoles((prev) => !prev)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: showCreateUserRoles ? 2 : 0,
                cursor: 'pointer',
                borderRadius: 1,
                px: 0.5,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {editingRoleName ? `EDIT USER ROLE: ${editingRoleName}` : 'CREATE USER ROLES'}
                </Typography>
                {editingRoleName && (
                  <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                    Editing existing role • Click Save to update
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {showCreateUserRoles ? 'Collapse' : 'Expand'}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateUserRoles((prev) => !prev);
                  }}
                >
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{ transform: showCreateUserRoles ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                  />
                </IconButton>
              </Box>
            </Box>

            {showCreateUserRoles && (
              <>
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
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      Set feature-level access first (Write/View only/Hide), then override individual pages where needed.
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                      {featureOptions.map((feature) => (
                        <Paper key={feature} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                          <Box sx={{ display: 'grid', gap: 1.25 }}>
                            <TextField
                              select
                              size="small"
                              label={`${feature.charAt(0).toUpperCase() + feature.slice(1)} (Feature level)`}
                              value={roleForm.featurePermissions?.[feature] || 'hide feature'}
                              onChange={(e) => handleFeaturePermissionChange(feature, e.target.value)}
                              sx={{ maxWidth: { xs: '100%', md: 340 } }}
                            >
                              {featurePermissionOptions.map((permission) => (
                                <MenuItem key={permission} value={permission}>
                                  {permission.charAt(0).toUpperCase() + permission.slice(1)}
                                </MenuItem>
                              ))}
                            </TextField>

                            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                              {(featurePageMap[feature] || []).map((page) => (
                                <TextField
                                  key={page.path}
                                  select
                                  size="small"
                                  label={page.label}
                                  value={roleForm.pagePermissions?.[page.path] || 'inherit'}
                                  onChange={(e) => handlePagePermissionChange(page.path, e.target.value)}
                                >
                                  {pagePermissionOptions.map((permission) => (
                                    <MenuItem key={permission} value={permission}>
                                      {permission.charAt(0).toUpperCase() + permission.slice(1)}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              ))}
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveRole}
                    disabled={!canSaveRole || isSavingRole}
                  >
                    {isSavingRole ? 'Saving...' : editingRoleName ? 'Update user role' : 'Save user role'}
                  </Button>
                  {editingRoleName && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditingRoleName('');
                        setRoleForm({
                          roleName: '',
                          roleDescription: '',
                          featurePermissions: defaultFeaturePermissions,
                          pagePermissions: {},
                        });
                        setStatusMessage('');
                      }}
                    >
                      Clear Edit
                    </Button>
                  )}
                </Box>
              </>
            )}
          </CardContent>
        </Card>

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
                <DataGrid
                  rows={savedRoleRows}
                  columns={savedRoleColumns}
                  disableSelectionOnClick
                  density="compact"
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                    columnVisibilityModel: { id: false },
                  }}
                  onRowClick={(params) => handleEditSavedRole(params.row._originalData)}
                  sx={{
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      fontSize: '0.875rem',
                    },
                    '& .MuiDataGrid-columnHeader': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      fontWeight: 700,
                      borderBottom: 'none',
                    },
                    '& .MuiDataGrid-row': {
                      cursor: 'pointer',
                      '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                      '&:hover': { backgroundColor: '#e9ecef' },
                    },
                  }}
                />
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
                <DataGrid
                  rows={savedUserRows}
                  columns={savedUserColumns}
                  disableSelectionOnClick
                  density="compact"
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25 } },
                    sorting: { sortModel: [{ field: 'companyName', sort: 'asc' }] },
                    columnVisibilityModel: { id: false },
                  }}
                  onRowClick={(params) => handleEditSavedUser(params.row._originalData)}
                  sx={{
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      fontSize: '0.875rem',
                    },
                    '& .MuiDataGrid-columnHeader': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      fontWeight: 700,
                      borderBottom: 'none',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                    },
                    '& .MuiDataGrid-row': {
                      cursor: 'pointer',
                      '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                      '&:hover': { backgroundColor: '#e9ecef' },
                    },
                  }}
                />
              </Paper>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

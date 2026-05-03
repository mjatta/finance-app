import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { useAddUser } from './Hooks/useAddUser';
import { getFullApiUrl } from '../../../utils/apiConfig';

const BRANCHES_CACHE_KEY = 'userSetup_remoteBranches';
const SETUP_CACHE_KEY = 'userSetup_setupPayload';

const featureOptions = ['member', 'loan', 'accounting', 'processing', 'system', 'reporting'];
const featurePermissionOptions = ['write', 'view only', 'hide feature'];
const pagePermissionOptions = ['inherit', 'write', 'view only', 'hide page'];

// Map feature keys to display labels
const featureLabelMap = {
  member: 'Customer Administration',
  loan: 'Loan Management',
  accounting: 'Financial Accounting',
  processing: 'Processing',
  system: 'System Administration',
  reporting: 'Reporting',
};

const getFeatureLabel = (feature) => featureLabelMap[feature] || feature.charAt(0).toUpperCase() + feature.slice(1);

const upsertByKey = (rows, nextRow, key) => {
  const nextKey = nextRow?.[key];
  if (!nextKey) {
    return [nextRow, ...rows];
  }

  const existingIndex = rows.findIndex((row) => row?.[key] === nextKey);
  if (existingIndex === -1) {
    return [nextRow, ...rows];
  }

  const updated = [...rows];
  updated[existingIndex] = nextRow;
  return updated;
};

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
    { path: '/member/member-activation', label: 'Customer Activation' },
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
    { path: '/accounting/verification', label: 'Verification' },
    { path: '/accounting/transaction-update', label: 'Transaction Update' },
    { path: '/accounting/transaction-reversal-adjustment', label: 'Transaction Reversal / Adjustment' },
    { path: '/accounting/account-enquiry', label: 'GL Account Enquiry' },
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
  const [rawBranchesData, setRawBranchesData] = useState([]);
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
  const { addUser } = useAddUser();

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
    loanLimit: '',
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
  const canSaveAll = useMemo(
    () => canSave && canSaveRole,
    [canSave, canSaveRole],
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
          // Use relative path so Vite proxy can intercept and handle CORS
          const url = getFullApiUrl('/api/remote-branches/branches');
          const remoteResp = await fetch(url);
          if (remoteResp.ok) {
            const remoteJson = await remoteResp.json();
            if (Array.isArray(remoteJson) && remoteJson.length > 0) {
              setRawBranchesData(remoteJson);
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

        // Use relative path for consistency with middleware
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
      loanLimit: userRecord?.loanLimit || '',
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

  const handleSaveAll = async () => {
    if (!canSaveAll || isReadOnlyRole) {
      if (!userForm.baseRole) {
        setStatusMessage('Please assign a role before saving the user.');
      } else if (!canSaveRole) {
        setStatusMessage('Please complete the user role details before saving.');
      }
      return;
    }

    setIsSavingUser(true);
    setIsSavingRole(true);
    setStatusMessage('');

    try {
      const rolePayload = {
        roleName: roleForm.roleName.trim(),
        roleDescription: roleForm.roleDescription.trim(),
        featurePermissions: roleForm.featurePermissions || {},
        pagePermissions: roleForm.pagePermissions || {},
      };

      // Call the backend API to create the user with role permissions
      const result = await addUser({
        userForm,
        roleForm,
        branchesData: rawBranchesData,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user.');
      }

      const payload = result.data;
      const responseUsers = Array.isArray(payload?.users) ? payload.users : null;
      const responseRoles = Array.isArray(payload?.roles) ? payload.roles : null;

      const responseUserRecord = payload?.user || payload?.User || payload?.data?.user || payload?.data?.User || null;
      const responseRoleRecord = payload?.role || payload?.Role || payload?.data?.role || payload?.data?.Role || null;

      const nextUserRecord = responseUserRecord
        ? {
            companyName: userForm.companyName,
            branch: userForm.branch,
            staffNumber: responseUserRecord?.Staffno || responseUserRecord?.staffNumber || userForm.staffNumber,
            userId: responseUserRecord?.ExternalId || responseUserRecord?.userId || userForm.userId,
            userName: responseUserRecord?.Username || responseUserRecord?.userName || userForm.userName,
            temporaryPassword: userForm.temporaryPassword,
            baseRole: responseUserRecord?.Role || responseUserRecord?.role || rolePayload.roleName || userForm.baseRole,
            cashAccount: responseUserRecord?.Cashaccont || responseUserRecord?.cashAccount || userForm.cashAccount,
            userType: userForm.userType,
            debitMit: responseUserRecord?.Debtlimitamt ?? responseUserRecord?.debtMit ?? userForm.debitMit,
            creditLimit: responseUserRecord?.Credlimitamt ?? responseUserRecord?.creditLimit ?? userForm.creditLimit,
            loanLimit: responseUserRecord?.Loanlimitamt ?? responseUserRecord?.loanLimit ?? userForm.loanLimit,
            loanApprovalLimit: Boolean(userForm.loanApprovalLimit),
            disableUser: Boolean(userForm.disableUser),
            resetPassword: Boolean(userForm.resetPassword),
          }
        : {
            ...userForm,
            baseRole: rolePayload.roleName || userForm.baseRole,
          };

      const nextRoleRecord = responseRoleRecord
        ? {
            roleName: responseRoleRecord?.Role || responseRoleRecord?.roleName || rolePayload.roleName,
            roleDescription: responseRoleRecord?.roleDescription || rolePayload.roleDescription,
            featurePermissions: responseRoleRecord?.FeaturePermissions || responseRoleRecord?.featurePermissions || rolePayload.featurePermissions,
            pagePermissions: responseRoleRecord?.PagePermissions || responseRoleRecord?.pagePermissions || rolePayload.pagePermissions,
          }
        : rolePayload;

      if (responseUsers) {
        setSavedUsers(responseUsers);
      } else {
        setSavedUsers((prev) => upsertByKey(prev, nextUserRecord, 'userId'));
      }

      if (responseRoles) {
        setSavedRoles(responseRoles);
      } else {
        setSavedRoles((prev) => upsertByKey(prev, nextRoleRecord, 'roleName'));
      }

      setCompanies((prev) => (prev.includes(userForm.companyName) ? prev : [...prev, userForm.companyName]));
      if (userForm.branch) {
        setBranches((prev) => (prev.includes(userForm.branch) ? prev : [...prev, userForm.branch]));
        setCompanyBranches((prev) => {
          const exists = prev.some(
            (item) => item.companyName === userForm.companyName && item.branchName === userForm.branch,
          );
          return exists ? prev : [...prev, { companyName: userForm.companyName, branchName: userForm.branch }];
        });
      }

      setBaseRoles((prev) => Array.from(new Set([...prev, rolePayload.roleName])));

      setStatusMessage('User setup and role saved successfully.');
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
        loanLimit: '',
        loanApprovalLimit: false,
        disableUser: false,
        resetPassword: false,
      }));
      setRoleForm({
        roleName: '',
        roleDescription: '',
        featurePermissions: defaultFeaturePermissions,
        pagePermissions: {},
      });
      setEditingUserId('');
      setEditingRoleName('');
      notifySaveSuccess({
        page: 'System Administration / User Setup',
        action: 'Save User Setup And Role',
        message: 'User setup and role saved successfully.',
      });
    } catch (error) {
      setStatusMessage('Unable to save user setup and role data.');
      notifySaveError({
        page: 'System Administration / User Setup',
        action: 'Save User Setup And Role',
        message: 'Unable to save user setup and role data.',
        error,
      });
    } finally {
      setIsSavingUser(false);
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
    <Box component="fieldset" sx={{ border: 'none', p: 3, m: 0 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          User Setup
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Create users, assign roles, and manage access across the system
        </Typography>
      </Box>

      {isReadOnlyRole && (
        <Alert severity="warning" sx={{ mb: 2, fontWeight: 700 }}>
          Read-only access: you can view fields, but cannot save user setup.
        </Alert>
      )}

      {statusMessage && (
        <Alert
          severity={statusMessage.startsWith('Unable') ? 'error' : 'success'}
          sx={{ mb: 2, '& .MuiAlert-message': { fontWeight: 700 } }}
        >
          {statusMessage}
        </Alert>
      )}

      <Box
        {...(isReadOnlyRole ? { inert: '' } : {})}
        sx={{ p: 0, m: 0, opacity: isReadOnlyRole ? 0.55 : 1 }}
      >
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, alignItems: 'start' }}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: editingUserId ? 'warning.main' : 'divider', bgcolor: editingUserId ? 'rgba(255, 193, 7, 0.05)' : 'background.paper' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                {editingUserId ? `Edit User: ${editingUserId}` : 'User Details'}
              </Typography>
              {editingUserId && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 2, fontWeight: 700 }}>
                  Editing existing user setup
                </Typography>
              )}

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2.5,
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
                  size="small"
                  fullWidth
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
                  size="small"
                  fullWidth
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected) => selected || 'Select a Branch',
                  }}
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

                <TextField label="Staff number" name="staffNumber" value={userForm.staffNumber} onChange={handleUserFormChange} size="small" fullWidth />
                <TextField label="User id" name="userId" value={userForm.userId} onChange={handleUserFormChange} size="small" fullWidth />
                <TextField label="User name" name="userName" value={userForm.userName} onChange={handleUserFormChange} size="small" fullWidth />
                <TextField label="Temporary password" name="temporaryPassword" value={userForm.temporaryPassword} onChange={handleUserFormChange} size="small" fullWidth />
                <TextField
                  select
                  label="Assign role"
                  name="baseRole"
                  value={userForm.baseRole}
                  onChange={handleUserFormChange}
                  required
                  size="small"
                  fullWidth
                  helperText={!userForm.baseRole ? 'Role is required for new user setup' : 'Selected role determines user permissions'}
                >
                  {baseRoles.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField label="Cash account" name="cashAccount" value={userForm.cashAccount} onChange={handleUserFormChange} size="small" fullWidth />
                <TextField select label="User type" name="userType" value={userForm.userType} onChange={handleUserFormChange} size="small" fullWidth>
                  <MenuItem value="maker">Maker</MenuItem>
                  <MenuItem value="checker">Checker</MenuItem>
                  <MenuItem value="approver">Approver</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </TextField>
                <TextField label="Debit Limit" name="debitMit" value={userForm.debitMit} onChange={handleUserFormChange} size="small" fullWidth />
                <TextField label="Credit limit" name="creditLimit" value={userForm.creditLimit} onChange={handleUserFormChange} size="small" fullWidth />
                <TextField label="Loan limit" name="loanLimit" value={userForm.loanLimit} onChange={handleUserFormChange} size="small" fullWidth />

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', gridColumn: { xs: '1 / -1', md: '1 / -1' }, pt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <FormControlLabel control={<Checkbox name="loanApprovalLimit" checked={userForm.loanApprovalLimit} onChange={handleUserFormChange} />} label="Loan approval limit" />
                  <FormControlLabel control={<Checkbox name="disableUser" checked={userForm.disableUser} onChange={handleUserFormChange} />} label="Disable user" />
                  <FormControlLabel control={<Checkbox name="resetPassword" checked={userForm.resetPassword} onChange={handleUserFormChange} />} label="Reset password" />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: editingRoleName ? 'warning.main' : 'divider', bgcolor: editingRoleName ? 'rgba(255, 193, 7, 0.05)' : 'background.paper' }}>
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
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                    {editingRoleName ? `Edit User Role: ${editingRoleName}` : 'User Roles'}
                  </Typography>
                  {editingRoleName && (
                    <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.75, fontWeight: 700 }}>
                      Editing existing role • Click save to update
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
                    size="small"
                    sx={{ flex: '1 1 240px', minWidth: 220 }}
                  />
                  <TextField
                    label="Role description"
                    name="roleDescription"
                    value={roleForm.roleDescription}
                    onChange={handleRoleFormChange}
                    size="small"
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
                              label={`${getFeatureLabel(feature)} (Feature level)`}
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
                      sx={{ fontWeight: 600, textTransform: 'none' }}
                    >
                      Clear Edit
                    </Button>
                  )}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 1.5, justifyContent: 'flex-start' }}>
          <Button
            variant="contained"
            onClick={handleSaveAll}
            disabled={!canSaveAll || isSavingUser || isSavingRole}
            sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
          >
            {isSavingUser || isSavingRole ? 'Saving...' : editingUserId || editingRoleName ? 'Update user setup' : 'Save user setup'}
          </Button>
        </Box>

        <Card sx={{ mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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
              <Typography variant="subtitle1" sx={{ fontWeight: 800, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                Saved User Roles
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
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' }}>
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
              <Typography variant="subtitle1" sx={{ fontWeight: 800, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#bdbdbd' }}>
                Saved Users
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
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' }}>
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

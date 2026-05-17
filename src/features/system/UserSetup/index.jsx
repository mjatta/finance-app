import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { useAddUser } from './hooks/useAddUser';
import { useGetAllUsers } from './hooks/useGetAllUsers';
import { useGetBasicDetails } from './hooks/useGetBasicDetails';
import { getFullApiUrl } from '../../../utils/apiConfig';

const BRANCHES_CACHE_KEY = 'userSetup_remoteBranches';
const BRANCHES_RAW_CACHE_KEY = 'userSetup_remoteBranchesRaw';
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

const getCompanyName = (record) => (record?.com_name || record?.companyName || '').toString().trim();
const getBranchName = (record) => (record?.branchName || record?.br_name || record?.branch || '').toString().trim();
const getBranchIdFromRecord = (record) => {
  const value = record?.br_id
    ?? record?.branchid
    ?? record?.BranchId
    ?? record?.Branchid
    ?? record?.branchId
    ?? record?.id
    ?? record?.gnBranchid
    ?? null;

  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

const createDefaultUserForm = (companyName = '') => ({
  companyName,
  branch: '',
  branchId: null,
  staffNumber: '',
  userId: '',
  userName: '',
  temporaryPassword: generateTemporaryPassword(),
  baseRole: '',
  cashAccount: '',
  userType: '',
  debitMit: '',
  creditLimit: '',
  loanLimit: '',
  loanApprovalLimit: false,
  disableUser: false,
  resetPassword: true,
});

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
    { path: '/loan/account-enquires', label: 'Loan Account Enquires' },
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
    { path: '/reporting/trial-balance', label: 'Trial Balance' },
    { path: '/reporting/income-statement', label: 'Income Statement' },
    { path: '/reporting/balance-sheet', label: 'Balance Sheet' },
    { path: '/reporting/savings-balance', label: 'Savings Balance' },
    { path: '/reporting/loan-balance', label: 'Loan Balance' },
    { path: '/reporting/loan-schedule', label: 'Loan Schedule' },
    { path: '/reporting/detailed-aging', label: 'Detailed Aging' },
    { path: '/reporting/transaction-listing', label: 'Transaction Listing' },
    { path: '/reporting/customer-enquiries', label: 'Customer Enquiries' },
  ],
};

export default function UserSetup({ user }) {
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [rawBranchesData, setRawBranchesData] = useState([]);
  const [companyBranches, setCompanyBranches] = useState([]);
  const [remoteBranchesLoaded, setRemoteBranchesLoaded] = useState(false);
  const [_baseRoles, setBaseRoles] = useState(['Admin', 'Supervisor', 'Officer']);
  const [_savedUsers, setSavedUsers] = useState([]);
  const [_savedRoles, setSavedRoles] = useState([]);
  const [showCreateUserRoles, setShowCreateUserRoles] = useState(false);
  const [editingUserId, setEditingUserId] = useState('');
  const [editingRoleName, setEditingRoleName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const { addUser } = useAddUser();
  const { cashAccounts, loading: cashAccountsLoading } = useGetBasicDetails();
  const { users: allUsers, loading: allUsersLoading } = useGetAllUsers();

  const [userForm, setUserForm] = useState(() => createDefaultUserForm(''));

  const [roleForm, setRoleForm] = useState({
    roleName: '',
    roleDescription: '',
    featurePermissions: defaultFeaturePermissions,
    pagePermissions: {},
  });
  const isReadOnlyRole = Boolean(user?.access?.readOnly);

  const canSave = useMemo(
    () => Boolean(
      userForm.companyName
      && userForm.branch
      && userForm.userId
      && userForm.userName
      && userForm.branchId !== null
      && userForm.branchId !== undefined,
    ),
    [userForm],
  );
  const availableBranches = useMemo(() => {
    if (remoteBranchesLoaded) return branches;
    if (!userForm.companyName) return branches;

    const linkedBranches = companyBranches
      .filter((item) => getCompanyName(item) === userForm.companyName)
      .map((item) => getBranchName(item))
      .filter(Boolean);

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
        branchId: prev.branch && remoteBranches.includes(prev.branch) ? prev.branchId : null,
      }));
    };

    const applySetupPayload = (payload) => {
      if (!isMounted) return;
      const payloadCompanies = Array.isArray(payload?.companies)
        ? payload.companies
          .map((item) => (typeof item === 'string' ? item.toString().trim() : getCompanyName(item)))
          .filter(Boolean)
        : [];

      if (payloadCompanies.length > 0) {
        setCompanies((prev) => Array.from(new Set([...prev, ...payloadCompanies])));
        setUserForm((prev) => ({ ...prev, companyName: prev.companyName || payloadCompanies[0] }));
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
      const cachedRawBranches = localStorage.getItem(BRANCHES_RAW_CACHE_KEY);
      if (cachedRawBranches) {
        const parsedRaw = JSON.parse(cachedRawBranches);
        if (Array.isArray(parsedRaw) && parsedRaw.length > 0) setRawBranchesData(parsedRaw);
      }
      const cachedSetup = localStorage.getItem(SETUP_CACHE_KEY);
      if (cachedSetup) applySetupPayload(JSON.parse(cachedSetup));
    } catch {
      // ignore corrupted cache
    }

    const loadSetupData = async () => {
      try {
        try {
          const companyDetailsUrl = getFullApiUrl('/api/lookups/creditunion/30');
          const companyDetailsResp = await fetch(companyDetailsUrl);
          if (companyDetailsResp.ok) {
            const companyDetailsPayload = await companyDetailsResp.json();
            const companyRecord = Array.isArray(companyDetailsPayload)
              ? companyDetailsPayload[0]
              : companyDetailsPayload;
            const companyNameFromEndpoint = getCompanyName(companyRecord);

            if (companyNameFromEndpoint) {
              setCompanies([companyNameFromEndpoint]);
              setUserForm((prev) => ({ ...prev, companyName: companyNameFromEndpoint }));
            }
          }
        } catch {
          // keep fallback values when endpoint is unavailable
        }

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
                try {
                  localStorage.setItem(BRANCHES_CACHE_KEY, JSON.stringify(remoteBranches));
                  localStorage.setItem(BRANCHES_RAW_CACHE_KEY, JSON.stringify(remoteJson));
                } catch { /* quota */ }
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
      setUserForm((prev) => ({ ...prev, branch: '', branchId: null }));
      return;
    }

    if (userForm.branch && !availableBranches.includes(userForm.branch)) {
      setUserForm((prev) => ({ ...prev, branch: '', branchId: null }));
    }
  }, [availableBranches, userForm.companyName, userForm.branch]);

  const handleUserFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setStatusMessage('');

    if (name === 'branch') {
      const normalizedValue = value.toString().trim().toLowerCase();
      
      // Try rawBranchesData first
      let branchObj = rawBranchesData.find(
        (item) => getBranchName(item).toLowerCase() === normalizedValue,
      );
      
      // Fallback: try companyBranches
      if (!branchObj) {
        branchObj = companyBranches.find(
          (item) => getBranchName(item).toLowerCase() === normalizedValue,
        );
      }
      
      const resolvedBranchId = getBranchIdFromRecord(branchObj);
      setUserForm((prev) => ({ ...prev, branch: value, branchId: resolvedBranchId || null }));
      return;
    }

    if (name === 'resetPassword' && type === 'checkbox') {
      setUserForm((prev) => {
        const nextResetValue = checked;
        return {
          ...prev,
          resetPassword: nextResetValue,
          temporaryPassword: nextResetValue ? (prev.temporaryPassword || generateTemporaryPassword()) : '',
        };
      });
      return;
    }

    if (name === 'cashAccount') {
      setUserForm((prev) => ({
        ...prev,
        cashAccount: (value ?? '').toString().trim(),
      }));
      return;
    }

    setUserForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCopyUserId = async () => {
    if (!userForm.userId) return;
    try {
      await navigator.clipboard.writeText(userForm.userId);
      setStatusMessage('User ID copied to clipboard.');
    } catch {
      setStatusMessage('Unable to copy User ID.');
    }
  };

  const handleCopyTemporaryPassword = async () => {
    if (!userForm.temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(userForm.temporaryPassword);
      setStatusMessage('Temporary password copied to clipboard.');
    } catch {
      setStatusMessage('Unable to copy temporary password.');
    }
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

  const normalizeFeaturePermission = (val) => {
    if (!val) return 'hide feature';
    if (val === 'hide') return 'hide feature';
    if (val === 'write' || val === 'view only' || val === 'hide feature') return val;
    return 'hide feature';
  };

  const normalizePagePermission = (val) => {
    if (!val) return 'inherit';
    if (val === 'hide') return 'hide page';
    if (val === 'write' || val === 'view only' || val === 'hide page' || val === 'inherit') return val;
    return 'inherit';
  };

  const handleEditSavedUser = (userRecord) => {
    const selectedCompanyName = getCompanyName(userRecord);
    const selectedBranch = getBranchName(userRecord);

    setUserForm({
      companyName: selectedCompanyName,
      branch: selectedBranch,
      branchId: getBranchIdFromRecord(userRecord),
      staffNumber: userRecord?.StaffNo || userRecord?.staffNumber || '',
      userId: userRecord?.UserID || userRecord?.userId || '',
      userName: userRecord?.UserName || userRecord?.userName || '',
      temporaryPassword: userRecord?.temporaryPassword || '',
      baseRole: userRecord?.Role || userRecord?.baseRole || '',
      cashAccount: userRecord?.CashAccount || userRecord?.cashAccount || '',
      userType: userRecord?.userType || '',
      debitMit: userRecord?.DebitLimit !== undefined && userRecord?.DebitLimit !== '' ? String(userRecord.DebitLimit) : (userRecord?.debitMit || ''),
      creditLimit: userRecord?.CreditLimit !== undefined && userRecord?.CreditLimit !== '' ? String(userRecord.CreditLimit) : (userRecord?.creditLimit || ''),
      loanLimit: userRecord?.LoanLimit !== undefined && userRecord?.LoanLimit !== '' ? String(userRecord.LoanLimit) : (userRecord?.loanLimit || ''),
      loanApprovalLimit: Boolean(userRecord?.loanApprovalLimit),
      disableUser: Boolean(userRecord?.disableUser),
      resetPassword: Boolean(userRecord?.resetPassword),
    });

    if (selectedCompanyName) {
      setCompanies((prev) => (prev.includes(selectedCompanyName) ? prev : [...prev, selectedCompanyName]));
    }
    if (selectedBranch) {
      if (!remoteBranchesLoaded) {
        setBranches((prev) => (prev.includes(selectedBranch) ? prev : [...prev, selectedBranch]));
      }
      if (selectedCompanyName) {
        setCompanyBranches((prev) => {
          const exists = prev.some(
            (item) => getCompanyName(item) === selectedCompanyName && getBranchName(item) === selectedBranch,
          );
          return exists ? prev : [...prev, { companyName: selectedCompanyName, branchName: selectedBranch }];
        });
      }
    }

    setEditingUserId(userRecord?.UserID || userRecord?.userId || '');
    setStatusMessage(`Editing user: ${userRecord?.UserName || userRecord?.UserID || userRecord?.userName || userRecord?.userId || '-'}`);

    // Preload existing feature/page permissions into the role form
    const rawFeaturePerms = userRecord?.FeaturePermissions && typeof userRecord.FeaturePermissions === 'object'
      ? userRecord.FeaturePermissions
      : {};
    const rawPagePerms = userRecord?.PagePermissions && typeof userRecord.PagePermissions === 'object'
      ? userRecord.PagePermissions
      : {};

    const normalizedFeaturePerms = {
      ...defaultFeaturePermissions,
      ...Object.fromEntries(
        Object.entries(rawFeaturePerms).map(([k, v]) => [k, normalizeFeaturePermission(v)]),
      ),
    };
    const normalizedPagePerms = Object.fromEntries(
      Object.entries(rawPagePerms)
        .map(([k, v]) => [k, normalizePagePermission(v)])
        .filter(([, v]) => v !== 'inherit'),
    );

    const roleName = (userRecord?.Role || userRecord?.baseRole || '').trim();
    setRoleForm({
      roleName,
      roleDescription: '',
      featurePermissions: normalizedFeaturePerms,
      pagePermissions: normalizedPagePerms,
    });
    setEditingRoleName(roleName);
    setShowCreateUserRoles(true);
  };

  const handleSaveAll = async () => {
    if (!canSave || isReadOnlyRole) {
      return;
    }

    if (!(userForm.cashAccount || '').toString().trim()) {
      setStatusMessage('Please select a cash account before saving.');
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

      if (rolePayload.roleName) {
        setBaseRoles((prev) => Array.from(new Set([...prev, rolePayload.roleName])));
      }

      setStatusMessage('User setup and role saved successfully.');
      setEditingUserId(userForm.userId || '');
      setUserForm((prev) => ({
        ...createDefaultUserForm(prev.companyName),
        branch: prev.branch,
        branchId: prev.branchId,
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

  const handleClearAll = () => {
    const defaultCompanyName = companies[0] || '';

    setUserForm(createDefaultUserForm(defaultCompanyName));

    setRoleForm({
      roleName: '',
      roleDescription: '',
      featurePermissions: defaultFeaturePermissions,
      pagePermissions: {},
    });

    setEditingUserId('');
    setEditingRoleName('');
    setShowCreateUserRoles(false);
    setSelectedUserIds([]);
    setStatusMessage('');
  };

  const savedUserColumns = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'userID', headerName: 'User ID', width: 120, flex: 0.6 },
      { field: 'userName', headerName: 'User Name', width: 160, flex: 0.8 },
      { field: 'staffNo', headerName: 'Staff No', width: 110, flex: 0.5 },
      { field: 'accessLevel', headerName: 'Access Level', width: 110, flex: 0.5 },
      { field: 'cashAccount', headerName: 'Cash Account', width: 140, flex: 0.7 },
      { field: 'features', headerName: 'Features', width: 180, flex: 0.9 },
      {
        field: 'featurePermissions',
        headerName: 'Feature Permissions',
        width: 220,
        flex: 1.1,
        valueFormatter: (value) => {
          if (value && typeof value === 'object' && Object.keys(value).length > 0) {
            return Object.entries(value)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' | ');
          }
          return '-';
        },
      },
      {
        field: 'pagePermissions',
        headerName: 'Page Permissions',
        width: 220,
        flex: 1.1,
        valueFormatter: (value) => {
          if (value && typeof value === 'object' && Object.keys(value).length > 0) {
            return Object.entries(value)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' | ');
          }
          return '-';
        },
      },
    ],
    [],
  );

  const savedUserRows = useMemo(
    () =>
      allUsers.map((item, idx) => ({
        id: `user-${idx}`,
        userID: item.UserID || '-',
        userName: item.UserName || '-',
        staffNo: item.StaffNo || '-',
        accessLevel: item.AccessLevel !== '' ? item.AccessLevel : '-',
        cashAccount: item.CashAccount || '-',
        features: item.Features || '-',
        featurePermissions: item.FeaturePermissions,
        pagePermissions: item.PagePermissions,
        _originalData: item,
      })),
    [allUsers],
  );

  const isSaving = isSavingUser || isSavingRole;

  return (
    <Box component="fieldset" sx={{ border: 'none', p: 3, m: 0, position: 'relative' }}>
      <Backdrop
        open={isSaving}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.7)',
          borderRadius: 1,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={88} thickness={5} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Saving user setup...
          </Typography>
        </Box>
      </Backdrop>

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
                <TextField
                  label="User id"
                  name="userId"
                  value={userForm.userId}
                  onChange={handleUserFormChange}
                  size="small"
                  fullWidth
                  helperText="This is the username the user will log in with"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f0faf0',
                      '& fieldset': { borderColor: '#43a047', borderWidth: 2 },
                      '&:hover fieldset': { borderColor: '#2e7d32' },
                      '&.Mui-focused fieldset': { borderColor: '#1b5e20' },
                    },
                    '& .MuiInputLabel-root': { color: '#2e7d32', fontWeight: 800 },
                    '& .MuiFormHelperText-root': { color: '#388e3c', fontWeight: 700 },
                  }}
                  InputProps={{
                    endAdornment: userForm.userId ? (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Copy user ID"
                          edge="end"
                          onClick={handleCopyUserId}
                          size="small"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
                <TextField label="Full Name" name="userName" value={userForm.userName} onChange={handleUserFormChange} size="small" fullWidth />
                <TextField
                  label="Temporary password"
                  name="temporaryPassword"
                  value={userForm.temporaryPassword}
                  onChange={handleUserFormChange}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#f0faf0',
                      '& fieldset': { borderColor: '#43a047', borderWidth: 2 },
                      '&:hover fieldset': { borderColor: '#2e7d32' },
                      '&.Mui-focused fieldset': { borderColor: '#1b5e20' },
                    },
                    '& .MuiInputLabel-root': { color: '#2e7d32', fontWeight: 800 },
                    '& .MuiFormHelperText-root': { color: '#388e3c', fontWeight: 700 },
                  }}
                  InputProps={{
                    readOnly: userForm.resetPassword,
                    endAdornment: userForm.resetPassword && userForm.temporaryPassword ? (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Copy temporary password"
                          edge="end"
                          onClick={handleCopyTemporaryPassword}
                          size="small"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  helperText={userForm.resetPassword ? 'Auto-generated temporary password' : ''}
                />
                <TextField
                  select
                  label="Cash account"
                  name="cashAccount"
                  value={userForm.cashAccount}
                  onChange={handleUserFormChange}
                  size="small"
                  fullWidth
                  helperText={cashAccountsLoading ? 'Loading cash accounts...' : ''}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected) => selected || 'Select Cash Account',
                  }}
                >
                  <MenuItem value="" disabled>
                    Select Cash Account
                  </MenuItem>
                  {cashAccounts.map((item) => (
                    <MenuItem key={item.cacctnumb} value={item.cacctnumb}>
                      {item.cacctnumb}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField label="Debit Limit" name="debitMit" value={userForm.debitMit} onChange={handleUserFormChange} size="small" fullWidth />
                <TextField label="Credit limit" name="creditLimit" value={userForm.creditLimit} onChange={handleUserFormChange} size="small" fullWidth />
                <TextField label="Loan limit" name="loanLimit" value={userForm.loanLimit} onChange={handleUserFormChange} size="small" fullWidth />

                <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' }, pt: 1.25, mt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.25, fontWeight: 800, color: '#2c3e50' }}>
                    Access & Security Options
                  </Typography>

                  <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
                    <Box sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: userForm.loanApprovalLimit ? 'rgba(25, 118, 210, 0.06)' : 'background.paper' }}>
                      <FormControlLabel
                        sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                        control={<Checkbox name="loanApprovalLimit" checked={userForm.loanApprovalLimit} onChange={handleUserFormChange} />}
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              Loan Approval Limit
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Allow this user to approve loans.
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>

                    <Box sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: userForm.disableUser ? 'rgba(211, 47, 47, 0.08)' : 'background.paper' }}>
                      <FormControlLabel
                        sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                        control={<Checkbox name="disableUser" checked={userForm.disableUser} onChange={handleUserFormChange} />}
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              Disable User
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Block sign-in for this account.
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>

                    <Box sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: userForm.resetPassword ? 'rgba(255, 152, 0, 0.10)' : 'background.paper' }}>
                      <FormControlLabel
                        sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                        control={<Checkbox name="resetPassword" checked={userForm.resetPassword} onChange={handleUserFormChange} />}
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              Reset Password
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Generate a temporary password.
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>
                  </Box>
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
            variant="outlined"
            onClick={handleClearAll}
            disabled={isSavingUser || isSavingRole}
            sx={{ fontWeight: 600, textTransform: 'none' }}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAll}
            disabled={!canSave || isSavingUser || isSavingRole}
            sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
          >
            {isSavingUser || isSavingRole ? 'Saving...' : editingUserId || editingRoleName ? 'Update user setup' : 'Save user setup'}
          </Button>
        </Box>

        <Card sx={{ mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Saved Users
              </Typography>
            </Box>
            <DataGrid
              rows={savedUserRows}
              columns={savedUserColumns}
              disableSelectionOnClick
              density="compact"
              pageSizeOptions={[10, 25, 50]}
              loading={allUsersLoading}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
                sorting: { sortModel: [{ field: 'userName', sort: 'asc' }] },
                columnVisibilityModel: { id: false },
              }}
              onRowClick={(params) => {
                handleEditSavedUser(params.row._originalData);
                const userId = params.row.userID;
                setSelectedUserIds((prev) => 
                  prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
                );
              }}
              getRowClassName={(params) => {
                if (selectedUserIds.includes(params.row.userID)) return 'selected-row';
                return '';
              }}
              sx={{
                '& .MuiDataGrid-root': { border: 'none', borderRadius: 0 },
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
                  '&.selected-row': {
                    backgroundColor: '#1976d2 !important',
                    color: '#ffffff',
                    fontWeight: 600,
                    '& .MuiDataGrid-cell': {
                      color: '#ffffff',
                      borderBottomColor: '#1565c0',
                    },
                    '&:hover': {
                      backgroundColor: '#1565c0 !important',
                    },
                  },
                },
              }}
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

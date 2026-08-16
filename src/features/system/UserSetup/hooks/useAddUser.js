import { useState } from 'react';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDateOnly = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
};

const getOprcode = (userForm) => {
  const explicitCode = (userForm.userId || '').trim();
  if (explicitCode) {
    return explicitCode.toUpperCase();
  }

  const nameParts = (userForm.userName || '').trim().split(/\s+/).filter(Boolean);
  return ((nameParts[0]?.[0] || '') + (nameParts[1]?.[0] || '') + (nameParts[2]?.[0] || '')).toUpperCase();
};

const getAccessLevel = (userForm) => {
  const userTypeMap = {
    maker: 1,
    checker: 2,
    approver: 3,
    viewer: 4,
  };

  const baseRoleMap = {
    Admin: 1,
    Supervisor: 2,
    Officer: 3,
  };

  return userTypeMap[userForm.userType] ?? baseRoleMap[userForm.baseRole] ?? 1;
};

const getEnabledFeatures = (featurePermissions) => {
  return Object.entries(featurePermissions || {})
    .filter(([, permission]) => permission && permission !== 'hide feature')
    .map(([feature]) => feature)
    .join(',');
};

export function useAddUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addUser = async ({ userForm, roleForm, branchesData: _branchesData }) => {
    setLoading(true);
    setError(null);

    try {
      if (!userForm.branchId) {
        throw new Error('Please select a valid branch before saving.');
      }

      const payload = {
        Compid: 30,
        Oprcode: getOprcode(userForm),
        Username: userForm.userName || '',
        Email: userForm.email || '',
        Phone: userForm.phone || '',
        Userpassword: userForm.temporaryPassword || '',
        Dateforce: toDateOnly(new Date()),
        ResetPassword: Boolean(userForm.resetPassword),
        MustChangePassword: Boolean(userForm.resetPassword),
        Branchid: Number(userForm.branchId),
        Cashaccont: (userForm.cashAccount || '').toString().trim(),
        Staffno: userForm.staffNumber || '',
        Accesslvl: getAccessLevel(userForm),
        Debtlimitamt: toNumber(userForm.debitMit),
        Credlimitamt: toNumber(userForm.creditLimit),
        Loanlimitamt: toNumber(userForm.loanLimit),
        Surpaccont: '99999999999',
        ExternalId: userForm.userId || '',
        Role: roleForm.roleName?.trim() || userForm.baseRole || '',
        Allpages: false,
        features: getEnabledFeatures(roleForm.featurePermissions),
        FeaturePermissions: roleForm.featurePermissions || {},
        PagePermissions: roleForm.pagePermissions || {},
        Region: userForm.selectedRegionId || '',
      };

      const response = await fetch('/api/Users/AddUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!response.ok) {
        throw new Error(
          typeof data === 'string' ? data : data?.message || `Failed to add user (${response.status})`,
        );
      }

      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Failed to add user');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { addUser, loading, error };
}

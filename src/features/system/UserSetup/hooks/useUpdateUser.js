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

export function useUpdateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateUser = async ({ userForm, roleForm }) => {
    setLoading(true);
    setError(null);

    try {
      if (!userForm.branchId) {
        throw new Error('Please select a valid branch before saving.');
      }

      const payload = {
        Compid: 30,
        Oprcode: (userForm.userId || '').trim().toUpperCase(),
        Username: userForm.userName || '',
        Email: userForm.email || '',
        Phone: userForm.phone || '',
        Userpassword: userForm.temporaryPassword || '',
        Dateforce: toDateOnly(new Date()),
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

      const response = await fetch('/api/Users/UpdateUser', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: !response.ok, data: text };
      }

      if (!response.ok) {
        throw new Error(data.message || data.Message || `HTTP ${response.status}`);
      }

      return {
        success: true,
        data: data.data || data || {},
      };
    } catch (err) {
      const message = err.message || 'Failed to update user.';
      setError(message);
      return {
        success: false,
        error: message,
      };
    } finally {
      setLoading(false);
    }
  };

  return { updateUser, loading, error };
}

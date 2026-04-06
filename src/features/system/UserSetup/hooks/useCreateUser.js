import { useState } from 'react';

export function useCreateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createUser = async (userForm, branchesData) => {
    setLoading(true);
    setError(null);

    try {
      // Build Oprcode from first letter of first name + first letter of surname
      const nameParts = (userForm.userName || '').trim().split(/\s+/);
      const oprcode = (
        (nameParts[0]?.[0] || '') + (nameParts[1]?.[0] || '')
      ).toUpperCase();

      // Look up branch ID from the raw branches data
      const branchObj = Array.isArray(branchesData)
        ? branchesData.find(
            (b) =>
              (b?.br_name || b?.branchName || b?.name || '').toString().trim() ===
              userForm.branch
          )
        : null;
      const branchId = branchObj?.br_id ?? branchObj?.branchId ?? branchObj?.id ?? 0;

      // Map role name to access level
      const roleLevelMap = { Admin: 1, Supervisor: 2, Officer: 3 };
      const accessLvl = roleLevelMap[userForm.baseRole] ?? 3;

      const payload = {
        Compid: 30,
        Oprcode: oprcode,
        Username: userForm.userName,
        Userpassword: userForm.temporaryPassword,
        Dateforce: new Date().toISOString(),
        Branchid: branchId,
        Cashaccont: userForm.cashAccount || '',
        Staffno: userForm.staffNumber || '',
        Accesslvl: accessLvl,
        Debtlimitamt: parseFloat(userForm.debitMit) || 0,
        Credlimitamt: parseFloat(userForm.creditLimit) || 0,
        Loanlimitamt: parseFloat(userForm.loanLimit) || 0,
        Surpaccont: '67890',
      };

      const response = await fetch('/api/Cusystem/AddUser', {
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
          typeof data === 'string' ? data : data?.message || `Failed to create user (${response.status})`
        );
      }

      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Failed to create user');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createUser, loading, error };
}

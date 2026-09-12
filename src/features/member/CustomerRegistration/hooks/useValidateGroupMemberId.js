import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useValidateGroupMemberId() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  const validateId = async (memberId) => {
    setLoading(true);
    setError(null);
    setValidationResult(null);

    try {
      if (!memberId || String(memberId).trim() === '') {
        setError('Please enter a Member ID');
        return { success: false, exists: false, error: 'Please enter a Member ID' };
      }

      const url = getFullApiUrl('/api/groupmembers/GetID');
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch group members (${response.status})`);
      }

      const data = await response.json();
      const members = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);

      // Check if the entered ID exists in the list (matching MemberID field)
      const existingMember = members.find((m) => String(m.MemberID || '').trim() === String(memberId).trim());

      if (existingMember) {
        const message = `Member ID already exists: ${existingMember.FirstName} ${existingMember.LastName}`;
        setError(message);
        setValidationResult({ exists: true, member: existingMember });
        return { success: false, exists: true, error: message, member: existingMember };
      }

      setValidationResult({ exists: false });
      return { success: true, exists: false, message: 'Member ID is available' };
    } catch (err) {
      const errorMessage = err.message || 'Failed to validate Member ID';
      setError(errorMessage);
      return { success: false, exists: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { validateId, loading, error, validationResult };
}

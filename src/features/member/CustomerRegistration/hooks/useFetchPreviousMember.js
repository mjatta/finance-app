import { useState } from 'react';

/**
 * Custom hook to fetch the just-saved institution's details after registration.
 * 1. Calls /api/client/get-code?fieldName=clientid to get the latest member code (string).
 * 2. Subtracts 1 from the string code, preserving leading zeros.
 * 3. Calls /api/getmember/{newCode} to fetch the institution just saved.
 *
 * @returns {Object} { fetchJustSavedInstitution, loading, error, data }
 */
export function useFetchJustSavedInstitution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * Fetch the just-saved institution's details.
   * @returns {Promise<Object>} The institution's details.
   */
  const fetchJustSavedInstitution = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      // Step 1: Get latest member code (string)
      const codeRes = await fetch('/api/client/get-code?fieldName=clientid');
      let codeData = null;
      try {
        codeData = await codeRes.json();
      } catch (jsonErr) {
        console.error('Failed to parse codeData JSON:', jsonErr);
        codeData = {};
      }
      if (!codeRes.ok) {
        setError((codeData && codeData.message) || `Failed to fetch latest member code (status ${codeRes.status})`);
        setData(null);
        throw new Error((codeData && codeData.message) || 'Failed to fetch latest member code');
      }
      let memberCode = codeData?.data?.memberCode;
      if (!memberCode) throw new Error('No member code found');
      // Step 2: Subtract 1 from the string, preserving leading zeros
      let num = parseInt(memberCode, 10);
      if (isNaN(num)) throw new Error('Invalid member code');
      let newNum = num - 1;
      let newCode = newNum.toString().padStart(memberCode.length, '0');
      // Step 3: Fetch the institution just saved
      const memberRes = await fetch(`/api/getmember/${newCode}`);
      let memberData = null;
      try {
        memberData = await memberRes.json();
      } catch (jsonErr) {
        console.error('Failed to parse memberData JSON:', jsonErr);
        memberData = {};
      }
      if (!memberRes.ok) {
        setError((memberData && memberData.message) || `Failed to fetch institution details (status ${memberRes.status})`);
        setData(null);
        throw new Error((memberData && memberData.message) || 'Failed to fetch institution details');
      }
      setData(memberData);
      return memberData;
    } catch (err) {
      setError(err.message || 'Unknown error');
      setData(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { fetchJustSavedInstitution, loading, error, data };
}

import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useMemberMessage() {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [data, setData] = useState(null);

  const fetchMemberMessage = async (customerCode) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      if (!customerCode || customerCode.trim() === '') {
        throw new Error('Customer code is required');
      }

      // Pad customer code to 6 digits
      const paddedCode = String(customerCode).padStart(6, '0');

      const url = getFullApiUrl(`/api/member-message/${paddedCode}`);
      console.log('Fetching member message from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Member message API response:', result);

      // Handle array response (first item) or direct object
      const messageData = Array.isArray(result) ? result[0] : result;

      setData({
        memberCode: messageData?.MemberCode || paddedCode,
        memberName: messageData?.MemberName || 'N/A',
        memberMessage: messageData?.MemberMessage || '',
      });

      return messageData;
    } catch (err) {
      console.error('Error fetching member message:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateMemberMessage = async (memberCode, memberMessage) => {
    try {
      setUpdating(true);
      setUpdateError(null);

      if (!memberCode || memberCode.trim() === '') {
        throw new Error('Member code is required');
      }

      const payload = {
        MemberCode: String(memberCode).padStart(6, '0'),
        MemberMessage: memberMessage || '',
      };

      const url = getFullApiUrl('/api/member-message/update');
      console.log('Updating member message at:', url, payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Member message update response:', result);

      // Update local state with new message
      setData((prev) => ({
        ...prev,
        memberMessage,
      }));

      return result;
    } catch (err) {
      console.error('Error updating member message:', err);
      setUpdateError(err.message);
      return null;
    } finally {
      setUpdating(false);
    }
  };

  return { fetchMemberMessage, updateMemberMessage, loading, updating, error, updateError, data };
}

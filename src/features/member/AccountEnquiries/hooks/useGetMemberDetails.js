import { useState } from 'react';
import { buildApiUrl } from '../../../../utils/apiConfig';

// Hook to fetch member details by member code
export function useGetMemberDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMemberDetails = async (memberCode) => {
    if (!memberCode || !memberCode.trim()) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Try primary enquiry (individual), then fallback to corporate, then group
      const custCode = memberCode.trim().padStart(6, '0');

      const callEnquiry = async (memberType) => {
        const url = buildApiUrl('member-enquiry', {
          ncompid: '30',
          custCode,
          memberType,
          acctStatus: 'A',
        });
        const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        return res;
      };

      // Primary: individual
      let response = await callEnquiry('individual');

      console.log(response, 'Raw response from member details API (individual)');

      // Handle 404 errors - member not found
      if (response.status === 404) {
        console.warn(`Member not found for code: ${memberCode}`);
        setError('Member not found');
        return null;
      }

      // Handle other HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      // Attempt to parse JSON response
      let payload;
      try {
        payload = await response.json();
      } catch (jsonError) {
        console.warn('Failed to parse member details response as JSON:', jsonError);
        setError('Invalid response format');
        return null;
      }

      // If no accounts returned, try corporate then group fallbacks
      const hasAccounts = Array.isArray(payload?.Accounts) && payload.Accounts.length > 0;
      if (!hasAccounts) {
        console.log('No accounts returned for individual; trying corporate endpoint');
        try {
          response = await callEnquiry('corporate');
          console.log(response, 'Raw response from member details API (corporate)');
          if (response.ok) {
            const corpPayload = await response.json();
            if (Array.isArray(corpPayload?.Accounts) && corpPayload.Accounts.length > 0) {
              setError(null);
              return corpPayload;
            }
          }
        } catch (errCorp) {
          console.warn('Corporate enquiry failed:', errCorp);
        }

        // Try group
        console.log('Trying group endpoint as final fallback');
        try {
          response = await callEnquiry('group');
          console.log(response, 'Raw response from member details API (group)');
          if (response.ok) {
            const groupPayload = await response.json();
            if (Array.isArray(groupPayload?.Accounts) && groupPayload.Accounts.length > 0) {
              setError(null);
              return groupPayload;
            }
          }
        } catch (errGroup) {
          console.warn('Group enquiry failed:', errGroup);
        }

        // No fallback returned accounts; continue to return original payload (may be empty)
      }

      // Validate response structure
      if (!payload || typeof payload !== 'object') {
        console.warn('Member details response is not an object:', payload);
        setError('Invalid response structure');
        return null;
      }

      setError(null);
      return payload;
    } catch (err) {
      // Handle network errors and other exceptions
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.error('Network error or CORS issue fetching member details:', err);
      } else {
        console.error('Error fetching member details:', err);
      }
      setError(err.message || 'Failed to fetch member details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchMemberDetails, loading, error };
}

import { useCallback } from 'react';

// Hook to fetch the most recent member code, subtract 1, pad with zeros, and return as string
export function useGetRecentMemberCode() {
  const getRecentMemberCode = useCallback(async () => {
    const response = await fetch('/api/client/get-code?fieldName=clientid');
    if (!response.ok) throw new Error('Failed to fetch member code');
    const data = await response.json();
    let memberCode = data?.memberCode;
    if (!memberCode || typeof memberCode !== 'string') throw new Error('Invalid member code format');
    // Remove leading zeros, subtract 1, pad with zeros to original length
    const codeNum = parseInt(memberCode, 10);
    if (isNaN(codeNum)) throw new Error('Member code is not numeric');
    const prevCodeNum = codeNum - 1;
    const paddedPrevCode = prevCodeNum.toString().padStart(memberCode.length, '0');
    return paddedPrevCode;
  }, []);
  return { getRecentMemberCode };
}

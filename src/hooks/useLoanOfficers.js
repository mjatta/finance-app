import { useState, useCallback } from 'react';

export const useLoanOfficers = () => {
  const [officers, setOfficers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoanOfficers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/loanbalances/loanofficers');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle different response formats
      let data = [];
      if (result?.status === 'success' && Array.isArray(result?.data)) {
        data = result.data;
      } else if (Array.isArray(result)) {
        data = result;
      } else if (result?.data && Array.isArray(result.data)) {
        data = result.data;
      }

      // Map response to component format, display username
      const mappedOfficers = data.map((officer) => ({
        value: officer?.usernumb?.toString() || officer?.oprcode?.trim() || '',
        label: officer?.username?.trim() || officer?.oprcode?.trim() || '',
        rawData: officer,
      }));

      setOfficers(mappedOfficers);
      return mappedOfficers;
    } catch (err) {
      setError(err.message);
      setOfficers([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    officers,
    isLoading,
    error,
    fetchLoanOfficers,
  };
};

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
      console.log('Loan Officers API Response:', result);
      
      // Handle different response formats
      let data = [];
      if (result?.status === 'success' && Array.isArray(result?.data)) {
        data = result.data;
      } else if (Array.isArray(result)) {
        data = result;
      } else if (result?.data && Array.isArray(result.data)) {
        data = result.data;
      } else if (result?.Data && Array.isArray(result.Data)) {
        data = result.Data;
      }

      console.log('Parsed officers data:', data);

      // Map response to component format, display username
      const mappedOfficers = data.map((officer) => ({
        value: officer?.usernumb?.toString() || officer?.oprcode?.trim() || officer?.OprCode?.trim() || '',
        label: officer?.username?.trim() || officer?.oprcode?.trim() || officer?.OprCode?.trim() || officer?.UserName?.trim() || '',
        rawData: officer,
      })).filter(o => o.label && o.value); // Filter out empty entries

      console.log('Mapped officers:', mappedOfficers);
      setOfficers(mappedOfficers);
      return mappedOfficers;
    } catch (err) {
      console.error('Error fetching loan officers:', err);
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

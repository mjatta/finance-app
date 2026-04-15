import { useState, useCallback } from 'react';
import { apiFetch } from '../utils/apiConfig';

/**
 * Custom hook for fetching and managing unverified journal transactions
 * Fetches data from /api/UnverifiedJournal/unverified endpoint
 */
export const useUnverifiedJournals = () => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);

  /**
   * Fetch unverified journals from the backend
   */
  const fetchUnverifiedJournals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFetch('unverified-journals');
      
      // Handle 404 as no data available (endpoint may not exist or no records)
      if (response.status === 404) {
        setJournals([]);
        setTotalDebit(0);
        setTotalCredit(0);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch unverified journals: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract and process journals array
      const journalsData = data.Journals || [];
      
      // Add unique ID to each row for DataGrid
      const processedJournals = journalsData.map((journal, index) => ({
        id: `${journal.jvno}-${journal.cacctnumb}-${index}`, // Unique ID for DataGrid
        ...journal,
      }));
      
      // Calculate totals
      const debits = processedJournals.reduce((sum, j) => sum + (parseFloat(j.ndebit) || 0), 0);
      const credits = processedJournals.reduce((sum, j) => sum + (parseFloat(j.ncredit) || 0), 0);
      
      setJournals(processedJournals);
      setTotalDebit(debits);
      setTotalCredit(credits);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching unverified journals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save verification for selected journals
   */
  const saveVerification = useCallback(async (selectedIds, verificationDetails) => {
    try {
      const selectedJournals = journals.filter(j => selectedIds.includes(j.id));
      
      const payload = {
        journals: selectedJournals,
        verificationDetails,
        verifiedBy: localStorage.getItem('userName') || 'Unknown',
        verificationTime: new Date().toISOString(),
      };
      
      const response = await apiFetch('unverified-journals-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save verification: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error saving verification:', err);
      throw err;
    }
  }, [journals]);

  return {
    journals,
    loading,
    error,
    totalDebit,
    totalCredit,
    fetchUnverifiedJournals,
    saveVerification,
  };
};

import { useState, useCallback } from 'react';

export const useAreas = () => {
  const [areas, setAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAreas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/lookups/counties');
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
      } else if (result?.Data && Array.isArray(result.Data)) {
        data = result.Data;
      }


      // Map response to component format
      const mappedAreas = data
        .map((area) => ({
          value: area?.coun_id?.toString() || area?.id?.toString() || area?.countyId?.toString() || area?.CountyId?.toString() || '',
          label: (area?.coun_name?.trim() || area?.name?.trim() || area?.countyName?.trim() || area?.CountyName?.trim() || '').replace(/\s+/g, ' '), // Trim extra spaces
          rawData: area,
        }))
        .filter((a) => a.label && a.value); // Filter out empty entries

      setAreas(mappedAreas);
      return mappedAreas;
    } catch (err) {
      console.error('Error fetching counties:', err);
      setError(err.message);
      setAreas([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    areas,
    isLoading,
    error,
    fetchAreas,
  };
};

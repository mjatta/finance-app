import { useState, useEffect } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

// Hook to fetch save logs from the API
export function useGetSaveLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSaveLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = getFullApiUrl('/api/systemAdministration/Logs');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Handle array response directly
      if (Array.isArray(data)) {
        setLogs(mapSaveLogs(data));
        return;
      }

      // Handle object response with common property names
      if (data && typeof data === 'object') {
        const resultArray = data.result || data.data || data.items || data.logs || [];
        if (Array.isArray(resultArray)) {
          setLogs(mapSaveLogs(resultArray));
          return;
        }
      }

      console.warn('Unexpected save logs API response format:', data);
      setLogs([]);
    } catch (err) {
      setError(err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaveLogs();
  }, []);

  return { logs, loading, error, refetch: fetchSaveLogs };
}

// Helper function to map API response to grid format
// Note: dateTime from API is in ISO format (includes timezone info) and will be displayed in user's local timezone
function mapSaveLogs(data) {
  return (data || []).map((item, index) => ({
    id: item.id || item.logId || index + 1,
    // timestamp stored in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) - includes timezone info
    // will be converted to user's local timezone when displayed via formatDateTime()
    timestamp: item.dateTime || item.date_time || item.timestamp || new Date().toISOString(),
    user: item.user || item.username || 'Unknown',
    page: item.page || 'Unknown',
    action: item.action || 'Unknown',
    status: item.status || 'Unknown',
    message: item.message || '',
    error: item.error || '',
    payload: item.payload || '',
  }));
}

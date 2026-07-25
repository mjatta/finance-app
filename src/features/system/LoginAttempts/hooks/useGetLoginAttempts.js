import { useState, useEffect } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

// Hook to fetch login attempts from the API
export function useGetLoginAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLoginAttempts = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = getFullApiUrl('/api/systemAdministration/LogAttempts');
      console.log('Fetching login attempts from:', url);

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
      console.log('Login attempts API response:', data);

      // Handle array response directly
      if (Array.isArray(data)) {
        setAttempts(mapLoginAttempts(data));
        return;
      }

      // Handle object response with common property names
      if (data && typeof data === 'object') {
        const resultArray = data.result || data.data || data.items || data.attempts || data.logs || [];
        if (Array.isArray(resultArray)) {
          setAttempts(mapLoginAttempts(resultArray));
          return;
        }
      }

      console.warn('Unexpected login attempts API response format:', data);
      setAttempts([]);
    } catch (err) {
      console.error('Error fetching login attempts:', err);
      setError(err.message);
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginAttempts();
  }, []);

  return { attempts, loading, error, refetch: fetchLoginAttempts };
}

// Helper function to map API response to grid format
// Note: dateTime from API is in ISO format (includes timezone info) and will be displayed in user's local timezone
function mapLoginAttempts(data) {
  return (data || []).map((item, index) => ({
    id: item.ID || item.id || item.attemptId || index + 1,
    // timestamp stored in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) - includes timezone info
    // will be converted to user's local timezone when displayed via formatDateTime()
    timestamp: item.dateTIme || item.dateTime || item.date_time || item.timestamp || new Date().toISOString(),
    username: item.user || item.username || 'Unknown',
    ip: item.IpAddress || item.ip_address || item.ip || 'Unknown',
    location: item.location || 'Unknown',
    device: item.device || 'Unknown',
    os: item.os || 'Unknown',
    status: (item.status || '').toLowerCase().includes('success') ? 'success' : 'failure',
    reason: item.reason || '',
  }));
}

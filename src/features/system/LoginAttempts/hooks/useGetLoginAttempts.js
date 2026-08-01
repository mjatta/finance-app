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

// The backend stamps its own server clock when logging attempts (ignoring any
// client-supplied time) and returns it WITHOUT a timezone designator, e.g.
// "2026-07-25T01:37:22.217". The backend server runs in UTC, so we must mark
// this string as UTC explicitly before it's converted to the user's local
// timezone for display; otherwise it gets treated as already-local and shown
// unconverted (several hours off from the user's actual wall-clock time).
function normalizeToUtcIso(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }
  // Already has a timezone designator (Z or +HH:MM/-HH:MM) - leave as-is.
  if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  return `${value}Z`;
}

// Helper function to map API response to grid format
// Note: dateTime from API has no timezone info and represents the backend
// server's UTC clock; normalizeToUtcIso() marks it as UTC so it converts
// correctly to the user's local timezone when displayed via formatDateTime()
function mapLoginAttempts(data) {
  return (data || []).map((item, index) => {
    const rawStatus = (item.status || '').toLowerCase();
    let status = 'failure';
    if (rawStatus.includes('success')) {
      status = 'success';
    } else if (rawStatus.includes('logout')) {
      status = 'logout';
    }
    
    return {
      id: item.ID || item.id || item.attemptId || index + 1,
      timestamp: normalizeToUtcIso(item.dateTIme || item.dateTime || item.date_time || item.timestamp) || new Date().toISOString(),
      username: item.user || item.username || 'Unknown',
      ip: item.IpAddress || item.ip_address || item.ip || 'Unknown',
      location: item.location || 'Unknown',
      device: item.device || 'Unknown',
      os: item.os || 'Unknown',
      status,
      reason: item.reason || '',
    };
  });
}

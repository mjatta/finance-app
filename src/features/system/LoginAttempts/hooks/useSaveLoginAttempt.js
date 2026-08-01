import { useState } from 'react';
import dayjs from 'dayjs';
import { getFullApiUrl } from '../../../../utils/apiConfig';

// Get IP address and location from a public IP API
const getIpAndLocation = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
    });
    if (!response.ok) throw new Error('Failed to fetch IP info');
    const data = await response.json();
    return {
      ipAddress: data.ip || 'Unknown',
      location: data.city || data.city_name || 'Unknown',
    };
  } catch (err) {
    console.error('Error fetching IP/location:', err);
    return {
      ipAddress: 'Unknown',
      location: 'Unknown',
    };
  }
};

// Parse user agent to get device and OS info
const getUserAgentInfo = () => {
  const ua = navigator.userAgent;
  let device = 'Unknown Device';
  let os = 'Unknown OS';

  // Detect OS
  if (ua.indexOf('Win') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'macOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

  // Detect device type
  if (ua.indexOf('Mobile') > -1 || ua.indexOf('Android') > -1) device = 'Mobile Phone';
  else if (ua.indexOf('iPad') > -1 || ua.indexOf('Tablet') > -1) device = 'Tablet';
  else device = 'Desktop/Laptop';

  return { device, os };
};

export function useSaveLoginAttempt() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveLoginAttempt = async (username, isSuccess) => {
    try {
      setLoading(true);
      setError(null);

      // Gather all required information
      const { ipAddress, location } = await getIpAndLocation();
      const { device, os } = getUserAgentInfo();

      const payload = {
        dateTime: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS'), // local wall-clock time (no UTC conversion)
        user: username || 'Unknown',
        IpAddress: ipAddress,
        location: location,
        device: device,
        os: os,
        status: isSuccess ? 'Login Success' : 'Login Failed',
      };


      const url = getFullApiUrl('/api/systemAdministration/InsertLogAttempts');
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

      return { success: true, data: result };
    } catch (err) {
      setError(err.message);
      // Don't throw - allow login to proceed even if logging fails
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { saveLoginAttempt, loading, error };
}

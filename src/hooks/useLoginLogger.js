import { useCallback } from 'react';
import dayjs from 'dayjs';
import { getFullApiUrl } from '../utils/apiConfig';
import { recordLoginAttempt } from '../utils/loginAttemptLogs';

// Lightweight client-side login logger
export function useLoginLogger() {
  const getDeviceInfo = () => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const platform = typeof navigator !== 'undefined' ? navigator.platform : '';
    const vendor = typeof navigator !== 'undefined' ? navigator.vendor : '';
    return { userAgent: ua, platform, vendor };
  };

  const getIpAndLocation = async () => {
    try {
      // Try to get public IP
      const ipResp = await fetch('https://api.ipify.org?format=json');
      if (!ipResp.ok) return { ip: '', location: '' };
      const { ip } = await ipResp.json();
      // Try to reverse geolocate via ipapi.co (best-effort)
      try {
        const geoResp = await fetch(`https://ipapi.co/${ip}/json/`);
        if (!geoResp.ok) return { ip, location: '' };
        const geo = await geoResp.json();
        const loc = [geo.city, geo.region, geo.country_name].filter(Boolean).join(', ');
        return { ip, location: loc };
      } catch {
        return { ip, location: '' };
      }
    } catch {
      return { ip: '', location: '' };
    }
  };

  const logAttempt = useCallback(async ({ username = '', status = 'failure', reason = '', metadata = {} }) => {
    const timestamp = new Date().toISOString();
    const device = getDeviceInfo();
    let ip = '';
    let location = '';
    try {
      const r = await getIpAndLocation();
      ip = r.ip || '';
      location = r.location || '';
    } catch (err) {
      // ignore
    }

    // Always persist locally first (localStorage) so the Login Attempts page
    // works reliably regardless of backend/serverless persistence issues.
    recordLoginAttempt({
      username,
      ip,
      location,
      device: device.vendor || '',
      os: device.platform || '',
      browser: device.userAgent || '',
      status,
      reason,
    });

    // Best-effort: send to backend endpoint; don't block caller on failure
    // Uses the same endpoint as useSaveLoginAttempt (InsertLogAttempts) since
    // /api/system/login-attempts is not a real backend route.
    const backendPayload = {
      dateTime: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS'), // local wall-clock time (no UTC conversion)
      user: username || 'Unknown',
      IpAddress: ip || 'Unknown',
      location: location || 'Unknown',
      device: device.vendor || 'Unknown',
      os: device.platform || 'Unknown',
      status: status === 'success' ? 'Login Success' : status === 'logout' ? 'Logout' : 'Login Failed',
      reason,
    };

    try {
      const url = getFullApiUrl('/api/systemAdministration/InsertLogAttempts');
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
      });
    } catch (err) {
      // swallow errors; local copy already persisted above
      // Optionally persist to localStorage queue for later retry
      try {
        const fallbackKey = 'loginAttempts:fallback';
        const existing = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
        existing.push({ timestamp, username, ip, location, status, reason, metadata });
        localStorage.setItem(fallbackKey, JSON.stringify(existing.slice(-200))); // keep last 200
      } catch (e) {
        // ignore
      }
    }
  }, []);

  return { logAttempt };
}

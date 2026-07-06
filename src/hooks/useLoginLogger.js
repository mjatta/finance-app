import { useCallback } from 'react';
import { getFullApiUrl } from '../utils/apiConfig';

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

    const payload = {
      timestamp,
      username,
      ipAddress: ip,
      location,
      deviceFingerprint: {
        userAgent: device.userAgent,
        platform: device.platform,
        vendor: device.vendor,
      },
      status,
      reason,
      metadata,
    };

    // Best-effort: send to backend endpoint; don't block caller on failure
    try {
      const url = getFullApiUrl('/api/system/login-attempts');
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // swallow errors; consider local fallback in future
      // Optionally persist to localStorage queue for later retry
      try {
        const fallbackKey = 'loginAttempts:fallback';
        const existing = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
        existing.push(payload);
        localStorage.setItem(fallbackKey, JSON.stringify(existing.slice(-200))); // keep last 200
      } catch (e) {
        // ignore
      }
    }
  }, []);

  return { logAttempt };
}

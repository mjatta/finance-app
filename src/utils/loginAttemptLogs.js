const LOGIN_LOG_STORAGE_KEY = 'microfinance.login.attempts';
const MAX_LOG_ENTRIES = 500;

const getStoredAttempts = () => {
  try {
    const raw = localStorage.getItem(LOGIN_LOG_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistAttempt = (entry) => {
  try {
    const existing = getStoredAttempts();
    const next = [entry, ...existing].slice(0, MAX_LOG_ENTRIES);
    localStorage.setItem(LOGIN_LOG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // no-op: avoid blocking login flow if localStorage is unavailable
  }
};

export const recordLoginAttempt = ({
  username = '',
  ip = '',
  location = '',
  device = '',
  os = '',
  browser = '',
  status = 'failure',
  reason = '',
} = {}) => {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    username,
    ip,
    location,
    device,
    os,
    browser,
    status,
    reason,
  };

  persistAttempt(entry);
  return entry;
};

export const getLoginAttempts = () => getStoredAttempts();

export const clearLoginAttempts = () => {
  try {
    localStorage.removeItem(LOGIN_LOG_STORAGE_KEY);
  } catch {
    // no-op
  }
};

export const LOGIN_LOG_KEY = LOGIN_LOG_STORAGE_KEY;

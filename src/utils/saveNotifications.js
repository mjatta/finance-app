const SAVE_LOG_STORAGE_KEY = 'microfinance.save.logs';
const MAX_LOG_ENTRIES = 500;
export const SAVE_TOAST_EVENT = 'microfinance:save-toast';
export const SAVE_TOAST_DURATION_MS = 45000;

const getStoredLogs = () => {
  try {
    const raw = localStorage.getItem(SAVE_LOG_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistLog = (entry) => {
  try {
    const existing = getStoredLogs();
    const next = [entry, ...existing].slice(0, MAX_LOG_ENTRIES);
    localStorage.setItem(SAVE_LOG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // no-op: avoid blocking user flow if localStorage is unavailable
  }
};

const emitToast = (payload) => {
  window.dispatchEvent(new CustomEvent(SAVE_TOAST_EVENT, { detail: payload }));
};

const getCurrentUsername = () => {
  try {
    const match = document.cookie.split('; ').find((cookie) => cookie.startsWith('user='));
    if (!match) {
      return 'Unknown User';
    }

    const value = decodeURIComponent(match.split('=')[1] || '');
    const parsed = JSON.parse(value);
    return parsed?.username || 'Unknown User';
  } catch {
    return 'Unknown User';
  }
};

const buildEntry = ({ status, page, action, message, error, metadata }) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  timestamp: new Date().toISOString(),
  user: getCurrentUsername(),
  status,
  page,
  action,
  message,
  error: error ? String(error) : '',
  metadata: metadata || null,
});

export const notifySaveSuccess = ({
  page,
  action = 'Save',
  message = 'Data saved successfully.',
  metadata,
}) => {
  const entry = buildEntry({
    status: 'success',
    page,
    action,
    message,
    metadata,
  });

  persistLog(entry);
  emitToast({ severity: 'success', message, duration: SAVE_TOAST_DURATION_MS });
};

export const notifySaveError = ({
  page,
  action = 'Save',
  message = 'Save failed. Please try again.',
  error,
  metadata,
}) => {
  const entry = buildEntry({
    status: 'error',
    page,
    action,
    message,
    error: error?.message || error,
    metadata,
  });

  persistLog(entry);
  emitToast({ severity: 'error', message, duration: SAVE_TOAST_DURATION_MS });
};

export const getSaveLogs = () => getStoredLogs();

export const clearSaveLogs = () => {
  try {
    localStorage.removeItem(SAVE_LOG_STORAGE_KEY);
  } catch {
    // no-op
  }
};

export const SAVE_LOG_KEY = SAVE_LOG_STORAGE_KEY;

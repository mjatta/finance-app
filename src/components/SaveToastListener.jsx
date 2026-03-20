import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { SAVE_TOAST_DURATION_MS, SAVE_TOAST_EVENT } from '../utils/saveNotifications';

export default function SaveToastListener() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleSaveToast = (event) => {
      if (!event?.detail?.message) {
        return;
      }

      const toast = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message: event.detail.message,
        severity: event.detail.severity || 'info',
        duration: Number(event.detail.duration) || SAVE_TOAST_DURATION_MS,
      };

      setToasts((prev) => [...prev, toast]);
    };

    window.addEventListener(SAVE_TOAST_EVENT, handleSaveToast);

    return () => {
      window.removeEventListener(SAVE_TOAST_EVENT, handleSaveToast);
    };
  }, []);

  const currentToast = toasts[0] || null;

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setToasts((prev) => prev.slice(1));
  };

  const autoHideDuration = useMemo(
    () => currentToast?.duration || SAVE_TOAST_DURATION_MS,
    [currentToast],
  );

  return (
    <Snackbar
      open={Boolean(currentToast)}
      onClose={handleClose}
      autoHideDuration={autoHideDuration}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: 24 }}
    >
      <Alert
        onClose={handleClose}
        severity={currentToast?.severity || 'info'}
        variant="filled"
        sx={{
          width: 'min(85vw, 720px)',
          fontSize: { xs: '1.05rem', md: '1.2rem' },
          fontWeight: 700,
          py: 2,
          px: 2.5,
          borderRadius: 2,
          boxShadow: 6,
        }}
      >
        {currentToast?.message || ''}
      </Alert>
    </Snackbar>
  );
}

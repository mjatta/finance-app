import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react";
import './index.css'
import App from './App.jsx'
import SaveToastListener from './components/SaveToastListener.jsx'
import { HashRouter as Router } from 'react-router-dom'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import InputAdornment from '@mui/material/InputAdornment'
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

// Initialize Sentry as early as possible
Sentry.init({
  dsn: "https://9d27335023fb696e12fc9f50253c06fe@o4511850372857856.ingest.us.sentry.io/4511850381312000",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: []
  },
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [
    "localhost", 
    /^https?:\/\/localhost/, 
    /^https?:\/\/127\.0\.0\.1/, 
    /^\/api\//  // Track all relative API calls
  ],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  // Enable logs to be sent to Sentry
  enableLogs: true
});

// Suppress MUI Grid v2 migration warnings in development
const originalWarn = console.warn
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('MUI Grid:')) {
    return
  }
  originalWarn(...args)
}

const queryClient = new QueryClient();
const theme = createTheme({
  components: {
    MuiTextField: {
      defaultProps: {
        InputProps: {
          startAdornment: (
            <InputAdornment position="start">
              <EditNoteRoundedIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            transition: 'border-color 0.2s ease',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94a3b8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        IconComponent: KeyboardArrowDownRoundedIcon,
      },
      styleOverrides: {
        icon: {
          color: '#64748b',
          transition: 'transform 0.2s ease',
        },
      },
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<div>An error has occurred</div>} showDialog>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Router>
              <SaveToastListener />
              <App />
            </Router>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
  </StrictMode>,
)

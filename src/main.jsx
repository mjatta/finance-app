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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

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

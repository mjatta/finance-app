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
        <Router>
          <SaveToastListener />
          <App />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)

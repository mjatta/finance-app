import InputAdornment from '@mui/material/InputAdornment'
import Box from '@mui/material/Box'
import { CURRENCY_SYMBOL } from '../utils/currencyFormatter'

/**
 * Styled "start" adornment for currency input fields.
 * Renders as a small pill on the left edge of the field, separated
 * from the typed value by a subtle divider.
 */
export function CurrencyAdornment({ symbol = CURRENCY_SYMBOL }) {
  return (
    <InputAdornment position="start">
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 22,
          px: 0.75,
          py: 0.25,
          mr: 0.5,
          borderRadius: 1,
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: 0.3,
          color: 'primary.main',
          bgcolor: 'rgba(102, 126, 234, 0.12)',
        }}
      >
        {symbol}
      </Box>
    </InputAdornment>
  )
}

/**
 * Styled "end" adornment for percentage input fields.
 * Renders as a small pill on the right edge of the field.
 */
export function PercentAdornment() {
  return (
    <InputAdornment position="end">
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 22,
          px: 0.75,
          py: 0.25,
          borderRadius: 1,
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: 0.3,
          color: '#ec4899',
          bgcolor: 'rgba(236, 72, 153, 0.12)',
        }}
      >
        %
      </Box>
    </InputAdornment>
  )
}

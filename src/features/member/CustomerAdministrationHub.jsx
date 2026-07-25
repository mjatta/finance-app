import React from 'react'
import { Box, Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded'
import ToggleOnRoundedIcon from '@mui/icons-material/ToggleOnRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded'
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded'
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import MessageRoundedIcon from '@mui/icons-material/MessageRounded'

const memberCards = [
  { title: 'Customer Registration', description: 'Register new customers', path: '/member/customer-registration', icon: HowToRegRoundedIcon, color: '#667eea', bgGradient: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%)' },
  { title: 'Customer Activation', description: 'Activate customer accounts', path: '/member/member-activation', icon: ToggleOnRoundedIcon, color: '#10b981', bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' },
  { title: 'Deposits', description: 'Manage customer deposits', path: '/member/deposits', icon: SavingsRoundedIcon, color: '#06b6d4', bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)' },
  { title: 'Withdrawal', description: 'Process withdrawals', path: '/member/withdrawal', icon: PaymentsRoundedIcon, color: '#ec4899', bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)' },
  { title: 'Account Enquiries', description: 'View account information', path: '/member/account-enquiries', icon: ManageSearchRoundedIcon, color: '#8b5cf6', bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)' },
  { title: 'Add Member Account', description: 'Add new member accounts', path: '/member/add-member-account', icon: PersonAddRoundedIcon, color: '#f59e0b', bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)' },
  { title: 'Member Activate', description: 'Activate member profiles', path: '/member/member-activate', icon: ToggleOnRoundedIcon, color: '#3b82f6', bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)' },
  { title: 'Account Activate', description: 'Activate member accounts', path: '/member/account-activate', icon: ToggleOnRoundedIcon, color: '#14b8a6', bgGradient: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%)' },
  { title: 'Member Close', description: 'Close member profiles', path: '/member/member-close-account', icon: PersonRemoveRoundedIcon, color: '#ef4444', bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)' },
  { title: 'Account Closure', description: 'Close member accounts', path: '/member/member-close', icon: PersonRemoveRoundedIcon, color: '#f97316', bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)' },
  { title: 'Member Transfer', description: 'Transfer member accounts', path: '/member/transfer', icon: SwapHorizRoundedIcon, color: '#06b6d4', bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)' },
  { title: 'Member Message', description: 'View member messages', path: '/member/member-message', icon: MessageRoundedIcon, color: '#f59e0b', bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)' },
  { title: 'Payroll Management', description: 'Manage payroll transactions', path: '/member/member-payroll-management', icon: ReceiptLongRoundedIcon, color: '#667eea', bgGradient: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%)' },
  { title: 'Reprint', description: 'Reprint documents', path: '/member/reprint', icon: PrintRoundedIcon, color: '#8b5cf6', bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)' },
]

export default function CustomerAdministrationHub() {
  const navigate = useNavigate()

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, minHeight: '100vh', bgcolor: '#f8f9fb' }}>
      <Box sx={{ mb: 4, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>Customer Administration</Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>Manage customer profiles, accounts, and transactions</Typography>
      </Box>

      <Grid container spacing={2}>
        {memberCards.map((card) => {
          const IconComponent = card.icon
          return (
            <Grid item xs={12} sm={6} md={4} key={card.path}>
              <Card
                onClick={() => navigate(card.path)}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: card.bgGradient,
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: card.color,
                    opacity: 0.85,
                  },
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', py: 3 }}>
                    <IconComponent sx={{ fontSize: 48, color: card.color, mb: 1.5, opacity: 0.8 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#0f172a' }}>
                      {card.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569' }}>
                      {card.description}
                    </Typography>
                  </CardContent>
                  <Box sx={{ px: 2, pb: 2, width: '100%', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: card.color, fontWeight: 600 }}>
                      Open →
                    </Typography>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

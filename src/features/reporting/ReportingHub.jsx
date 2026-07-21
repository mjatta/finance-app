import React from 'react'
import { Box, Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import BalanceRoundedIcon from '@mui/icons-material/BalanceRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import BookRoundedIcon from '@mui/icons-material/BookRounded'
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded'
import GroupWorkRoundedIcon from '@mui/icons-material/GroupWorkRounded'
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded'

const reportCards = [
  { title: 'Trial Balance', description: 'View trial balance summary', path: '/reporting/trial-balance', icon: BalanceRoundedIcon, color: '#667eea', bgGradient: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%)' },
  { title: 'Income Statement', description: 'View income statement', path: '/reporting/income-statement', icon: TrendingUpRoundedIcon, color: '#10b981', bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' },
  { title: 'Balance Sheet', description: 'View balance sheet', path: '/reporting/balance-sheet', icon: AssessmentRoundedIcon, color: '#f59e0b', bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)' },
  { title: 'Savings Balance', description: 'View savings balance report', path: '/reporting/savings-balance', icon: SavingsRoundedIcon, color: '#06b6d4', bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)' },
  { title: 'Loan Balance', description: 'View loan balance report', path: '/reporting/loan-balance', icon: AccountBalanceWalletRoundedIcon, color: '#ec4899', bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)' },
  { title: 'Loan Schedule', description: 'View loan schedule', path: '/reporting/loan-schedule', icon: HistoryRoundedIcon, color: '#8b5cf6', bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)' },
  { title: 'Group Report', description: 'View group report', path: '/reporting/group-report', icon: GroupWorkRoundedIcon, color: '#3b82f6', bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)' },
  { title: 'Detailed Aging', description: 'View detailed aging report', path: '/reporting/detailed-aging', icon: TimelineRoundedIcon, color: '#ef4444', bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)' },
  { title: 'Bank Reconciliation', description: 'Run bank reconciliation reports', path: '/reporting/bank-reconciliation-report', icon: CompareArrowsRoundedIcon, color: '#14b8a6', bgGradient: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%)' },
  { title: 'Loan Provision', description: 'View loan provision report', path: '/reporting/loan-provision', icon: AttachMoneyRoundedIcon, color: '#f97316', bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)' },
  { title: 'Transaction Listing', description: 'View transaction listing', path: '/reporting/transaction-listing', icon: BookRoundedIcon, color: '#06b6d4', bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)' },
  { title: 'Journal Report', description: 'View journal report', path: '/reporting/journal-report', icon: AssessmentRoundedIcon, color: '#667eea', bgGradient: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%)' },
  { title: 'Detailed Journal Report', description: 'View detailed journal report', path: '/reporting/detailed-journal-report', icon: ManageSearchRoundedIcon, color: '#8b5cf6', bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)' },
  { title: 'Loan Reports', description: 'View loan reports', path: '/reporting/loan-reports', icon: TrendingUpRoundedIcon, color: '#10b981', bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' },
  { title: 'Customer Enquiries', description: 'View customer enquiries', path: '/reporting/customer-enquiries', icon: PersonSearchRoundedIcon, color: '#f59e0b', bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)' },
  { title: 'Audit Trail Report', description: 'View audit trail activities', path: '/reporting/audit-trail-report', icon: VerifiedUserRoundedIcon, color: '#ef4444', bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)' },
]

export default function ReportingHub() {
  const navigate = useNavigate()

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, minHeight: '100vh', bgcolor: '#f8f9fb' }}>
      <Box sx={{ mb: 4, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Reporting &amp; Analytics</Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>Select a report to view, analyze, or export data</Typography>
      </Box>

      <Grid container spacing={2}>
        {reportCards.map((report) => {
          const IconComponent = report.icon
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={report.path}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '10px',
                  boxShadow: 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '3px',
                    background: report.color,
                    opacity: 0.85,
                  },
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(report.path)}
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', p: 2.5, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: '40px',
                          height: '40px',
                          flexShrink: 0,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${report.color}12`,
                        }}
                      >
                        <IconComponent sx={{ fontSize: 22, color: report.color }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem', lineHeight: 1.3 }}>{report.title}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.55, fontSize: '0.83rem', flex: 1 }}>{report.description}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 1, mt: 'auto', borderTop: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        View Report
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

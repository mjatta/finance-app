import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';

const payrollCards = [
  { title: 'Payroll Processing', description: 'Process member payroll and contributions', icon: ReceiptLongRoundedIcon, color: '#667eea', bgGradient: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%)' },
  { title: 'Salary Management', description: 'Manage salary schedules and deductions', icon: AccountBalanceRoundedIcon, color: '#10b981', bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' },
  { title: 'Payroll Analysis', description: 'View payroll trends and analytics', icon: TrendingUpRoundedIcon, color: '#f59e0b', bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)' },
  { title: 'Deduction Setup', description: 'Configure payroll deductions', icon: CalculateRoundedIcon, color: '#06b6d4', bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)' },
];

export default function MemberPayroll() {
  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, minHeight: '100vh', bgcolor: '#f8f9fb' }}>
      <Box sx={{ mb: 4, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '1.2rem' }}>Member Payroll</Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>Manage member payroll, contributions, and salary processing</Typography>
      </Box>

      <Grid container spacing={2}>
        {payrollCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={card.title}>
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
                    background: card.color,
                    opacity: 0.85,
                  },
                  '&:hover': {
                    borderColor: card.color,
                    boxShadow: `0 4px 16px ${card.color}20`,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ background: card.bgGradient, borderRadius: 1, p: 2, mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <IconComponent sx={{ fontSize: 40, color: card.color, opacity: 0.8 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.95rem' }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

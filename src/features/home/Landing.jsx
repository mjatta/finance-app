import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GroupIcon from '@mui/icons-material/Group';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalculateIcon from '@mui/icons-material/Calculate';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InsightsIcon from '@mui/icons-material/Insights';

const categories = [
  {
    key: 'member',
    label: 'Member Administration',
    description: 'Manage members, deposits, verification and adjustments.',
    icon: <GroupIcon fontSize="large" color="primary" />,
  },
  {
    key: 'loan',
    label: 'Loan Management',
    description: 'Handle repayments, recovery and loan lifecycle operations.',
    icon: <AccountBalanceWalletIcon fontSize="large" color="primary" />,
  },
  {
    key: 'accounting',
    label: 'Financial Accounting',
    description: 'Track ledgers, reconciliations and periodic processing.',
    icon: <CalculateIcon fontSize="large" color="primary" />,
  },
  {
    key: 'system',
    label: 'System Administration',
    description: 'Configure users, roles, security and module setup.',
    icon: <AdminPanelSettingsIcon fontSize="large" color="primary" />,
  },
  {
    key: 'reporting',
    label: 'Reporting & Analytics',
    description: 'View operational reports and performance snapshots.',
    icon: <InsightsIcon fontSize="large" color="primary" />,
  },
];

export default function Landing({ onSelectCategory, allowedFeatures = [] }) {
  const visibleCategories =
    allowedFeatures.length > 0
      ? categories.filter((cat) => allowedFeatures.includes(cat.key))
      : categories;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f6f8fc' }}>

      {/* main content area */}
      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(110deg, #0d47a1 0%, #1976d2 70%)',
            color: 'white',
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Stack spacing={1.5}>
              <Chip
                label="SACCO Management Dashboard"
                sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Welcome to Microfinance App
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.92, maxWidth: 760 }}>
                Select a core module below to continue your daily workflow. Your team can manage members,
                loans, accounting, system controls, and reporting from one place.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Active Members</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>2,450</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Loan Portfolio</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>D 18.6M</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Collections Today</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>D 96,300</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Pending Approvals</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>14</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Main Features
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click a module to open its navigation on the left.
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {visibleCategories.map((cat) => (
            <Grid key={cat.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: 'primary.50', display: 'grid', placeItems: 'center' }}>
                    {cat.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{cat.label}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                    {cat.description}
                  </Typography>
                  <Box sx={{ mt: 'auto' }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => onSelectCategory(cat.key)}
                    >
                      Open Module
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

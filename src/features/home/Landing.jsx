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
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
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
    key: 'processing',
    label: 'Processing',
    description: 'Run subscriptions, interest calculations and period dues.',
    icon: <AutorenewRoundedIcon fontSize="large" color="primary" />,
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

const dashboardStats = [
  {
    label: 'Active Members',
    value: '2,450',
    helper: '12% growth this quarter',
    accent: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
    icon: <GroupIcon sx={{ color: 'white', fontSize: 26 }} />,
  },
  {
    label: 'Loan Portfolio',
    value: 'D 18.6M',
    helper: 'Healthy performing balance',
    accent: 'linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)',
    icon: <AccountBalanceWalletIcon sx={{ color: 'white', fontSize: 26 }} />,
  },
  {
    label: 'Collections Today',
    value: 'D 96,300',
    helper: 'Strong branch collection pace',
    accent: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
    icon: <CalculateIcon sx={{ color: 'white', fontSize: 26 }} />,
  },
  {
    label: 'Pending Approvals',
    value: '14',
    helper: 'Awaiting review across teams',
    accent: 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
    icon: <InsightsIcon sx={{ color: 'white', fontSize: 26 }} />,
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
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 5,
            border: '1px solid rgba(147, 197, 253, 0.18)',
            background: 'linear-gradient(135deg, #082f73 0%, #0f4fa8 52%, #2490ff 100%)',
            color: 'white',
            boxShadow: '0 28px 60px rgba(15, 23, 42, 0.18)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -70,
              right: -40,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -90,
              left: -30,
              width: 260,
              height: 260,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
            },
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 4 }, position: 'relative', zIndex: 1 }}>
            <Stack spacing={1.5}>
              <Chip
                label="Social Development Fund"
                sx={{
                  alignSelf: 'flex-start',
                  height: 30,
                  px: 0.5,
                  bgcolor: 'rgba(255,255,255,0.14)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.16)',
                  backdropFilter: 'blur(8px)',
                  '& .MuiChip-label': {
                    px: 0.9,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  },
                }}
              />
              <Box sx={{ display: 'grid', gap: 1.25, maxWidth: 820 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    fontSize: { xs: '1.55rem', md: '2.3rem' },
                  }}
                >
                  Welcome to the Social Development Fund operations dashboard
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    maxWidth: 640,
                    color: 'rgba(255,255,255,0.84)',
                    lineHeight: 1.7,
                    fontSize: { xs: '0.9rem', md: '0.98rem' },
                  }}
                >
                  Manage daily activity across members, finance, processing, and reporting from one unified workspace.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          {dashboardStats.map((stat) => (
            <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  height: '100%',
                  borderRadius: 4,
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
                  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: -32,
                    right: -24,
                    width: 112,
                    height: 112,
                    borderRadius: '50%',
                    background: 'rgba(148, 163, 184, 0.10)',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
                  <Stack spacing={2.5}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            mb: 1,
                          }}
                        >
                          {stat.label}
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 800,
                            letterSpacing: '-0.04em',
                            color: '#0f172a',
                            lineHeight: 1.05,
                          }}
                        >
                          {stat.value}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 54,
                          height: 54,
                          borderRadius: 3,
                          background: stat.accent,
                          display: 'grid',
                          placeItems: 'center',
                          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.16)',
                          flexShrink: 0,
                        }}
                      >
                        {stat.icon}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        px: 1.5,
                        py: 1.15,
                        borderRadius: 3,
                        bgcolor: 'rgba(241, 245, 249, 0.9)',
                        border: '1px solid rgba(226, 232, 240, 0.95)',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                        {stat.helper}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
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

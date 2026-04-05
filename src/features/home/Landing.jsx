import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GroupIcon from '@mui/icons-material/Group';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalculateIcon from '@mui/icons-material/Calculate';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InsightsIcon from '@mui/icons-material/Insights';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import ManRoundedIcon from '@mui/icons-material/ManRounded';
import WomanRoundedIcon from '@mui/icons-material/WomanRounded';
import Diversity3RoundedIcon from '@mui/icons-material/Diversity3Rounded';
import { getFullApiUrl } from '../../utils/apiConfig';

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

const DASHBOARD_SUMMARY_URL = getFullApiUrl('/api/dashboard/summary?compId=30');

const defaultMembersSummary = {
  male: 2025,
  female: 580,
  group: 421,
  total: 3026,
};

const toCount = (value) => {
  if (typeof value === 'number') return value;
  const parsed = Number(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCount = (value) => toCount(value).toLocaleString();

export default function Landing({ onSelectCategory, allowedFeatures = [] }) {
  const [membersSummary, setMembersSummary] = useState(defaultMembersSummary);

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        const response = await fetch(DASHBOARD_SUMMARY_URL);
        if (!response.ok || !isMounted) return;

        const payload = await response.json();
        const members = payload?.data?.members;
        if (!members || !isMounted) return;

        setMembersSummary({
          male: toCount(members.male),
          female: toCount(members.female),
          group: toCount(members.group),
          total: toCount(members.total),
        });
      } catch {
        // keep fallback values if endpoint is unavailable
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleCategories =
    allowedFeatures.length > 0
      ? categories.filter((cat) => allowedFeatures.includes(cat.key))
      : categories;

  const dashboardStats = [
    {
      label: 'Active Members',
      value: formatCount(membersSummary.total),
      helper: 'Total members',
      accent: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
      icon: <Groups2RoundedIcon sx={{ color: 'white', fontSize: 26 }} />,
    },
    {
      label: 'Male',
      value: formatCount(membersSummary.male),
      helper: 'Male members',
      accent: 'linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)',
      icon: <ManRoundedIcon sx={{ color: 'white', fontSize: 26 }} />,
    },
    {
      label: 'Female',
      value: formatCount(membersSummary.female),
      helper: 'Female members',
      accent: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
      icon: <WomanRoundedIcon sx={{ color: 'white', fontSize: 26 }} />,
    },
    {
      label: 'Group',
      value: formatCount(membersSummary.group),
      helper: 'Group members',
      accent: 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
      icon: <Diversity3RoundedIcon sx={{ color: 'white', fontSize: 26 }} />,
    },
  ];

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
              <Box sx={{ display: 'grid', gap: 1.25, width: '100%' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    fontSize: { xs: '1.55rem', md: '2.3rem' },
                    textAlign: 'center',
                  }}
                >
                  Welcome to the Social Development Fund operations dashboard
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

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const reportSamples = [
  {
    id: 'RPT-001',
    name: 'Member Portfolio Summary',
    category: 'Member',
    frequency: 'Daily',
    format: 'PDF / Excel',
    status: 'Active',
  },
  {
    id: 'RPT-002',
    name: 'Loan Aging Analysis',
    category: 'Loan',
    frequency: 'Weekly',
    format: 'Excel',
    status: 'Active',
  },
  {
    id: 'RPT-003',
    name: 'Repayment Collection Performance',
    category: 'Loan',
    frequency: 'Monthly',
    format: 'PDF',
    status: 'Active',
  },
  {
    id: 'RPT-004',
    name: 'Savings Growth Trend',
    category: 'Member',
    frequency: 'Monthly',
    format: 'PDF / Excel',
    status: 'Active',
  },
  {
    id: 'RPT-005',
    name: 'Department Authorization Audit',
    category: 'System',
    frequency: 'Weekly',
    format: 'PDF',
    status: 'Active',
  },
];

const analyticsSamples = [
  { title: 'Total Active Members', value: '12,480', change: '+3.8% vs last month' },
  { title: 'Outstanding Loan Book', value: 'GMD 142.6M', change: '+1.9% vs last month' },
  { title: 'Collection Efficiency', value: '94.2%', change: '+0.7% improvement' },
  { title: 'Portfolio at Risk (30+)', value: '5.1%', change: '-0.4% improvement' },
];

const monthlyPerformance = [
  { month: 'Jan', disbursed: 'GMD 12.2M', collected: 'GMD 10.9M', newMembers: 410, par30: '5.9%' },
  { month: 'Feb', disbursed: 'GMD 13.1M', collected: 'GMD 11.8M', newMembers: 436, par30: '5.6%' },
  { month: 'Mar', disbursed: 'GMD 12.7M', collected: 'GMD 12.1M', newMembers: 452, par30: '5.4%' },
  { month: 'Apr', disbursed: 'GMD 14.0M', collected: 'GMD 12.9M', newMembers: 470, par30: '5.1%' },
];

export default function Reporting() {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Reporting & Analytics
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {analyticsSamples.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {item.title}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                  {item.change}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h6">Report Samples</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small">Preview</Button>
              <Button variant="contained" size="small">Export</Button>
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Report ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Report Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Frequency</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Format</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportSamples.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>{report.id}</TableCell>
                    <TableCell>{report.name}</TableCell>
                    <TableCell>{report.category}</TableCell>
                    <TableCell>{report.frequency}</TableCell>
                    <TableCell>{report.format}</TableCell>
                    <TableCell>
                      <Chip label={report.status} size="small" color="success" variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Analytics Samples (Monthly Performance)
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Loan Disbursed</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Collection</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>New Members</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>PAR 30+</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyPerformance.map((row) => (
                  <TableRow key={row.month} hover>
                    <TableCell>{row.month}</TableCell>
                    <TableCell>{row.disbursed}</TableCell>
                    <TableCell>{row.collected}</TableCell>
                    <TableCell>{row.newMembers}</TableCell>
                    <TableCell>{row.par30}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

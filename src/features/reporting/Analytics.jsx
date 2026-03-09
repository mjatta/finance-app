import React from 'react';
import {
  Box,
  Card,
  CardContent,
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
import { BarChart, PieChart } from '@mui/x-charts';

const loanPortfolioMix = [
  { id: 0, value: 42, label: 'Development Loan' },
  { id: 1, value: 28, label: 'Emergency Loan' },
  { id: 2, value: 18, label: 'Salary Loan' },
  { id: 3, value: 12, label: 'Group Loan' },
];

const repaymentStatusMix = [
  { id: 0, value: 74, label: 'On-time' },
  { id: 1, value: 16, label: 'Late < 30 days' },
  { id: 2, value: 10, label: 'Late 30+ days' },
];

const regionalMemberMix = [
  { id: 0, value: 31, label: 'Banjul' },
  { id: 1, value: 27, label: 'Kanifing' },
  { id: 2, value: 24, label: 'Brikama' },
  { id: 3, value: 18, label: 'Farafenni' },
];

const savingsSegmentMix = [
  { id: 0, value: 48, label: 'Regular Savers' },
  { id: 1, value: 29, label: 'High Savers' },
  { id: 2, value: 23, label: 'New Savers' },
];

const monthlyDisbursementVsCollection = [
  { month: 'Jan', disbursed: 10.8, collected: 9.4 },
  { month: 'Feb', disbursed: 11.5, collected: 10.0 },
  { month: 'Mar', disbursed: 12.2, collected: 10.9 },
  { month: 'Apr', disbursed: 12.9, collected: 11.6 },
  { month: 'May', disbursed: 13.4, collected: 12.1 },
  { month: 'Jun', disbursed: 14.1, collected: 12.8 },
];

const branchEfficiencySeries = [
  { branch: 'Banjul Main', efficiency: 96.2 },
  { branch: 'Serekunda', efficiency: 94.8 },
  { branch: 'Brikama', efficiency: 93.6 },
  { branch: 'Farafenni', efficiency: 92.7 },
  { branch: 'Lamin', efficiency: 91.9 },
];

const topBranches = [
  { branch: 'Banjul Main', members: 3110, disbursed: 'GMD 22.4M', collection: '96.2%' },
  { branch: 'Serekunda', members: 2850, disbursed: 'GMD 19.7M', collection: '94.8%' },
  { branch: 'Brikama', members: 2280, disbursed: 'GMD 15.9M', collection: '93.6%' },
  { branch: 'Farafenni', members: 1965, disbursed: 'GMD 12.8M', collection: '92.7%' },
];

const metricCards = [
  { label: 'Average Loan Size', value: 'GMD 84,500', delta: '+2.1% this quarter' },
  { label: 'Monthly Active Borrowers', value: '7,920', delta: '+4.5% this month' },
  { label: 'Recovery Rate', value: '91.3%', delta: '+1.2% improvement' },
  { label: 'Savings-to-Loan Ratio', value: '38.9%', delta: '+0.9% vs target' },
];

export default function ReportingAnalytics() {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {metricCards.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.label}>
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                  {item.delta}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Loan Portfolio Mix
              </Typography>
              <PieChart
                series={[
                  {
                    data: loanPortfolioMix,
                    innerRadius: 36,
                    outerRadius: 105,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
                height={260}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Repayment Status Mix
              </Typography>
              <PieChart
                series={[
                  {
                    data: repaymentStatusMix,
                    innerRadius: 36,
                    outerRadius: 105,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
                height={260}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Regional Member Mix
              </Typography>
              <PieChart
                series={[
                  {
                    data: regionalMemberMix,
                    innerRadius: 36,
                    outerRadius: 105,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
                height={260}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Savings Segment Mix
              </Typography>
              <PieChart
                series={[
                  {
                    data: savingsSegmentMix,
                    innerRadius: 36,
                    outerRadius: 105,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
                height={260}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Monthly Disbursement vs Collection (GMD M)
              </Typography>
              <BarChart
                xAxis={[
                  {
                    scaleType: 'band',
                    data: monthlyDisbursementVsCollection.map((row) => row.month),
                  },
                ]}
                series={[
                  {
                    label: 'Disbursed',
                    data: monthlyDisbursementVsCollection.map((row) => row.disbursed),
                  },
                  {
                    label: 'Collected',
                    data: monthlyDisbursementVsCollection.map((row) => row.collected),
                  },
                ]}
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Branch Collection Efficiency (%)
              </Typography>
              <BarChart
                xAxis={[
                  {
                    scaleType: 'band',
                    data: branchEfficiencySeries.map((row) => row.branch),
                  },
                ]}
                series={[
                  {
                    label: 'Efficiency',
                    data: branchEfficiencySeries.map((row) => row.efficiency),
                  },
                ]}
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Branch Performance Metrics
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Active Members</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Loan Disbursed</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Collection Efficiency</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topBranches.map((row) => (
                  <TableRow key={row.branch} hover>
                    <TableCell>{row.branch}</TableCell>
                    <TableCell>{row.members}</TableCell>
                    <TableCell>{row.disbursed}</TableCell>
                    <TableCell>{row.collection}</TableCell>
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

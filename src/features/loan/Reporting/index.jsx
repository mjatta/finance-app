import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { BarChart, PieChart } from '@mui/x-charts';

const portfolioDistribution = [
  { id: 0, value: 45, label: 'Development Loans' },
  { id: 1, value: 25, label: 'Emergency Loans' },
  { id: 2, value: 18, label: 'Salary Loans' },
  { id: 3, value: 12, label: 'Group Loans' },
];

const monthlyCollections = [
  { month: 'Jan', disbursed: 10.5, collected: 9.2 },
  { month: 'Feb', disbursed: 11.7, collected: 10.1 },
  { month: 'Mar', disbursed: 12.3, collected: 10.9 },
  { month: 'Apr', disbursed: 13.6, collected: 11.8 },
  { month: 'May', disbursed: 12.9, collected: 12.1 },
  { month: 'Jun', disbursed: 14.2, collected: 12.7 },
];

export default function LoanReporting() {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Loan Reporting
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Portfolio Distribution
              </Typography>
              <PieChart
                series={[
                  {
                    data: portfolioDistribution,
                    innerRadius: 35,
                    outerRadius: 105,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Monthly Disbursement vs Collection (GMD Millions)
              </Typography>
              <BarChart
                xAxis={[
                  {
                    scaleType: 'band',
                    data: monthlyCollections.map((item) => item.month),
                  },
                ]}
                series={[
                  {
                    label: 'Disbursed',
                    data: monthlyCollections.map((item) => item.disbursed),
                  },
                  {
                    label: 'Collected',
                    data: monthlyCollections.map((item) => item.collected),
                  },
                ]}
                height={300}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

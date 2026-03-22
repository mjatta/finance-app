import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

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

          <div style={{ height: 350, width: '100%' }}>
            <DataGrid
              rows={reportSamples.map((r) => ({ ...r }))}
              columns={[
                { field: 'id', headerName: 'Report ID', flex: 0.8, minWidth: 90 },
                { field: 'name', headerName: 'Report Name', flex: 1.5, minWidth: 180 },
                { field: 'category', headerName: 'Category', flex: 0.8, minWidth: 90 },
                { field: 'frequency', headerName: 'Frequency', flex: 0.8, minWidth: 90 },
                { field: 'format', headerName: 'Format', flex: 0.9, minWidth: 100 },
                {
                  field: 'status',
                  headerName: 'Status',
                  flex: 0.7,
                  minWidth: 80,
                  renderCell: (params) => (
                    <Chip label={params.value} size="small" color="success" variant="outlined" />
                  ),
                },
              ]}
              pageSizeOptions={[10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              density="compact"
              sx={{
                '& .MuiDataGrid-columnHeader': { backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 },
                '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f8f9fa' },
                '& .MuiDataGrid-row:hover': { backgroundColor: '#e9ecef' },
                '& .MuiDataGrid-cell': { borderColor: '#dee2e6' },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Analytics Samples (Monthly Performance)
          </Typography>

          <div style={{ height: 300, width: '100%' }}>
            <DataGrid
              rows={monthlyPerformance.map((r, idx) => ({ id: idx, ...r }))}
              columns={[
                { field: 'month', headerName: 'Month', flex: 0.7, minWidth: 80 },
                { field: 'disbursed', headerName: 'Loan Disbursed', flex: 1, minWidth: 120 },
                { field: 'collected', headerName: 'Collection', flex: 1, minWidth: 110 },
                { field: 'newMembers', headerName: 'New Members', flex: 1, minWidth: 110 },
                { field: 'par30', headerName: 'PAR 30+', flex: 0.8, minWidth: 90 },
              ]}
              pageSizeOptions={[10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              density="compact"
              sx={{
                '& .MuiDataGrid-columnHeader': { backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 },
                '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f8f9fa' },
                '& .MuiDataGrid-row:hover': { backgroundColor: '#e9ecef' },
                '& .MuiDataGrid-cell': { borderColor: '#dee2e6' },
              }}
            />
          </div>
        </CardContent>
      </Card>
    </Box>
  );
}

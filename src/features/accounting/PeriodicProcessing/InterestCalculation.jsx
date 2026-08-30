import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useInterestCalculationProducts } from './hooks/useInterestCalculationProducts';
import { useResetMinimumBalance } from './hooks/useResetMinimumBalance';
import { useLastYearMinimumBalance } from './hooks/useLastYearMinimumBalance';
import { useMonthMinimumBalance } from './hooks/useMonthMinimumBalance';
import { useCalculateMinimumBalance } from './hooks/useCalculateMinimumBalance';
import { useCalculateAccruedInterest } from './hooks/useCalculateAccruedInterest';

export default function InterestCalculation() {
  const { products: rows } = useInterestCalculationProducts();
  const { resetMinimumBalance, loading: resetting } = useResetMinimumBalance();
  const { getLastYearMinimumBalance, loading: loadingLastYear } = useLastYearMinimumBalance();
  const { getMonthMinimumBalance, loading: loadingMonth } = useMonthMinimumBalance();
  const { calculateMinimumBalance, loading: calculatingBalance } = useCalculateMinimumBalance();
  const { calculateAccruedInterest, loading: calculatingAccruedInterest } = useCalculateAccruedInterest();
  const calculating = resetting || loadingLastYear || loadingMonth || calculatingBalance;
  const [fromDate, setFromDate] = useState(dayjs().startOf('month'));
  const [toDate, setToDate] = useState(dayjs().endOf('month'));
  const [currentStep, setCurrentStep] = useState(0);
  const [rowSelectionModel, setRowSelectionModel] = useState({ type: 'include', ids: new Set() });
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

  const steps = ['Reset', 'Last Year', 'Month', 'Calculate'];

  const selectedProductId = Array.from(rowSelectionModel?.ids || [])[0];

  const handleCalculate = async () => {
    if (!selectedProductId) {
      setAlertSeverity('error');
      setAlertMessage('✗ Please select a product before calculating');
      setAlertOpen(true);
      return;
    }

    setCurrentStep(0);

    // Step 1: Reset
    const resetResult = await resetMinimumBalance();
    if (!resetResult.success) {
      setAlertSeverity('error');
      setAlertMessage(`✗ ${resetResult.errorMessage || 'Reset failed'}`);
      setAlertOpen(true);
      return;
    }

    // Step 2: Last Year
    setCurrentStep(1);
    const lastYearResult = await getLastYearMinimumBalance();
    if (!lastYearResult.success) {
      setAlertSeverity('error');
      setAlertMessage(`✗ ${lastYearResult.errorMessage || 'Failed to fetch last year data'}`);
      setAlertOpen(true);
      return;
    }

    // Step 3: Month
    setCurrentStep(2);
    const monthResult = await getMonthMinimumBalance();
    if (!monthResult.success) {
      setAlertSeverity('error');
      setAlertMessage(`✗ ${monthResult.errorMessage || 'Failed to fetch month data'}`);
      setAlertOpen(true);
      return;
    }

    // Step 4: Calculate
    setCurrentStep(3);
    const calculateResult = await calculateMinimumBalance({
      productId: selectedProductId,
      startYear: fromDate.year(),
      startMonth: fromDate.month() + 1,
      endMonth: toDate.month() + 1,
    });

    if (calculateResult.success) {
      setCurrentStep(steps.length);
      setAlertSeverity('success');
      setAlertMessage('✓ Interest calculation completed successfully');
    } else {
      setAlertSeverity('error');
      setAlertMessage(`✗ ${calculateResult.errorMessage || 'Interest calculation failed'}`);
    }
    setAlertOpen(true);
  };

  const handleInterestCalculation = async () => {
    if (!selectedProductId) {
      setAlertSeverity('error');
      setAlertMessage('✗ Please select a product before calculating');
      setAlertOpen(true);
      return;
    }

    setCurrentStep(0);
    const result = await calculateAccruedInterest({
      productId: selectedProductId,
      startYear: fromDate.year(),
      startMonth: fromDate.month() + 1,
      endMonth: toDate.month() + 1,
    });

    if (result.success) {
      setCurrentStep(steps.length);
      setAlertSeverity('success');
      setAlertMessage('✓ Interest calculation completed successfully');
    } else {
      setAlertSeverity('error');
      setAlertMessage(`✗ ${result.errorMessage || 'Interest calculation failed'}`);
    }
    setAlertOpen(true);
  };

  const handleInterestApplication = async () => {
    console.log('Interest Application:', { fromDate, toDate });
    try {
      setCurrentStep(0);
      
      // Step 1: Validating
      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentStep(1);
      
      // Step 2: Processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentStep(2);
      
      // Step 3: Complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(3);
    } catch (error) {
      console.error('Error:', error);
      setCurrentStep(0);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>Savings Interest Calculation</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>Manage savings interest rates and calculation methods by product</Typography>
        </CardContent>
      </Card>

      {alertOpen && (
        <Alert
          severity={alertSeverity}
          onClose={() => setAlertOpen(false)}
          sx={{ mb: 2, borderRadius: 1.5, fontSize: '0.95rem', fontWeight: 500 }}
        >
          {alertMessage}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 3, width: '100%' }}>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Savings Interest Products</Typography>
          </Box>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={[
                { field: 'category', headerName: 'Category', flex: 0.9, minWidth: 120, align: 'center', headerAlign: 'center' },
                { field: 'productName', headerName: 'Product Name', flex: 1.2, minWidth: 140, align: 'center', headerAlign: 'center' },
                { field: 'interestRate', headerName: 'Interest Rate', flex: 0.9, minWidth: 110, align: 'center', headerAlign: 'center' },
                { field: 'interestScope', headerName: 'Interest Scope', flex: 1.1, minWidth: 130, align: 'center', headerAlign: 'center' },
                { field: 'calculationMethod', headerName: 'Calculation Method', flex: 1.2, minWidth: 140, align: 'center', headerAlign: 'center' },
                { field: 'mandate', headerName: 'Mandate', flex: 0.8, minWidth: 100, align: 'center', headerAlign: 'center' },
              ]}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
              checkboxSelection
              disableMultipleRowSelection
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={(newModel) => setRowSelectionModel(newModel)}
              density="compact"
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
                '& .MuiDataGrid-columnHeader': { backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Processing Card */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem', color: '#2c3e50' }}>Processing</Typography>
          
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Box>
          </LocalizationProvider>

          {/* Progress Bar with Steps */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, mb: 2, display: 'block', color: '#666' }}>
              Processing Progress
            </Typography>
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, (currentStep / (steps.length - 1)) * 100)}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: currentStep >= steps.length - 1 ? '#4caf50' : '#667eea',
                    borderRadius: 4,
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                {steps.map((label, index) => (
                  <Typography 
                    key={label}
                    variant="caption" 
                    sx={{ 
                      fontWeight: index <= currentStep ? 600 : 400,
                      color: index <= currentStep ? '#667eea' : '#999',
                      fontSize: '0.75rem'
                    }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>
            </Box>
            <Stepper activeStep={currentStep} sx={{ pt: 1 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleCalculate}
              disabled={calculating}
              sx={{
                backgroundColor: '#667eea',
                '&:hover': { backgroundColor: '#5568d3' },
                fontWeight: 600,
                py: 1.2,
              }}
            >
              Calculate
            </Button>
            <Button
              variant="outlined"
              onClick={handleInterestCalculation}
              disabled={calculatingAccruedInterest}
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                fontWeight: 600,
                py: 1.2,
                '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.04)' },
              }}
            >
              Interest Calculation
            </Button>
            <Button
              variant="outlined"
              onClick={handleInterestApplication}
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                fontWeight: 600,
                py: 1.2,
                '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.04)' },
              }}
            >
              Interest Application
            </Button>
          </Box>
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
}

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useBranches } from '../../hooks/useBranches';

const normalizeBranchName = (branch) => (
  branch?.branchName
  || branch?.br_name
  || branch?.name
  || branch?.branch
  || ''
).toString().trim();

export default function LoanBalance() {
  const { branches, loading: branchesLoading } = useBranches();
  const [branch, setBranch] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [product, setProduct] = useState('');
  const [memberStatus, setMemberStatus] = useState({
    active: false,
    closed: false,
  });
  const [customerType, setCustomerType] = useState({
    individual: false,
    group: false,
    corporate: false,
  });
  const [gender, setGender] = useState({
    male: false,
    female: false,
  });
  const [statusMessage, setStatusMessage] = useState('');

  const branchOptions = useMemo(
    () => Array.from(new Set((Array.isArray(branches) ? branches : []).map(normalizeBranchName).filter(Boolean))),
    [branches],
  );

  const products = ['Development Loan', 'Emergency Loan', 'Regular Loan', 'Consumer Loan', 'Building Loan', 'Tobaski Loan'];

  const handlePrint = () => {
    if (!branch || !date) {
      setStatusMessage('Please select a branch and date before printing.');
      return;
    }

    setStatusMessage('');
    window.print();
  };

  const handleMemberStatusChange = (event) => {
    const { name, checked } = event.target;
    setMemberStatus((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleCustomerTypeChange = (event) => {
    const { name, checked } = event.target;
    setCustomerType((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleGenderChange = (event) => {
    const { name, checked } = event.target;
    setGender((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Loan Balance
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Generate loan balance reports by branch, product, and member details.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 900, mx: 'auto' }}>
        <CardContent sx={{ p: 3 }}>

          {statusMessage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {statusMessage}
            </Alert>
          )}

          {/* Row 1: Branch and Date */}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
            <TextField
              select
              label="Branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              size="small"
              fullWidth
              disabled={branchesLoading}
              SelectProps={{ displayEmpty: true, renderValue: (selected) => selected || 'Select a branch' }}
            >
              <MenuItem value="" disabled>
                Select a branch
              </MenuItem>
              {branchOptions.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Row 2: Products */}
          <Box sx={{ mb: 3 }}>
            <TextField
              select
              label="Products"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              size="small"
              fullWidth
              SelectProps={{ displayEmpty: true, renderValue: (selected) => selected || 'Select a product' }}
            >
              <MenuItem value="" disabled>
                Select a product
              </MenuItem>
              {products.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Row 3: Member Status Checkboxes */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#555' }}>
              Member Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={memberStatus.active}
                    onChange={handleMemberStatusChange}
                    name="active"
                  />
                }
                label="Active Member"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={memberStatus.closed}
                    onChange={handleMemberStatusChange}
                    name="closed"
                  />
                }
                label="Closed Members"
              />
            </Box>
          </Box>

          {/* Row 4: Customer Type Checkboxes */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#555' }}>
              Customer Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={customerType.individual}
                    onChange={handleCustomerTypeChange}
                    name="individual"
                  />
                }
                label="Individual"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={customerType.group}
                    onChange={handleCustomerTypeChange}
                    name="group"
                  />
                }
                label="Group"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={customerType.corporate}
                    onChange={handleCustomerTypeChange}
                    name="corporate"
                  />
                }
                label="Corporate"
              />
            </Box>
          </Box>

          {/* Row 5: Gender Checkboxes */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#555' }}>
              Gender
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={gender.male}
                    onChange={handleGenderChange}
                    name="male"
                  />
                }
                label="Male"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={gender.female}
                    onChange={handleGenderChange}
                    name="female"
                  />
                }
                label="Female"
              />
            </Box>
          </Box>

          {/* Print Button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              onClick={handlePrint}
              disabled={!branch || !date || branchesLoading}
              sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
            >
              Print
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

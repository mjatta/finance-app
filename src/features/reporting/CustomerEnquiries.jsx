import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
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

const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];
const EDUCATION_LEVEL_OPTIONS = ['No Formal Education', 'Primary', 'Secondary', 'Vocational / Technical', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'];
const REGIONS = ['West Coast Region', 'Lower River Region', 'North Bank Region', 'Central River Region', 'Upper River Region'];

export default function CustomerEnquiries() {
  const { branches, loading: branchesLoading } = useBranches();

  // Location filters
  const [branch, setBranch] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');

  // Profile filters
  const [maritalStatus, setMaritalStatus] = useState('');
  const [educationalLevel, setEducationalLevel] = useState('');

  // Account status
  const [activeAccount, setActiveAccount] = useState(false);
  const [closedAccount, setClosedAccount] = useState(false);

  // Date ranges
  const [openDateFrom, setOpenDateFrom] = useState('');
  const [openDateTo, setOpenDateTo] = useState('');
  const [closeDateFrom, setCloseDateFrom] = useState('');
  const [closeDateTo, setCloseDateTo] = useState('');

  // Customer type
  const [customerType, setCustomerType] = useState({
    individual: false,
    group: false,
    corporate: false,
  });

  // Age range
  const [ageFrom, setAgeFrom] = useState('');
  const [ageTo, setAgeTo] = useState('');

  // Gender
  const [gender, setGender] = useState({
    male: false,
    female: false,
  });

  const [statusMessage, setStatusMessage] = useState('');

  const branchOptions = useMemo(
    () => Array.from(new Set((Array.isArray(branches) ? branches : []).map(normalizeBranchName).filter(Boolean))),
    [branches],
  );

  const handleCustomerTypeChange = (e) => {
    const { name, checked } = e.target;
    setCustomerType((prev) => ({ ...prev, [name]: checked }));
  };

  const handleGenderChange = (e) => {
    const { name, checked } = e.target;
    setGender((prev) => ({ ...prev, [name]: checked }));
  };

  const handlePrint = () => {
    if (!branch) {
      setStatusMessage('Please select a branch before printing.');
      return;
    }
    setStatusMessage('');
    window.print();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, color: 'white' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Customer Enquiries
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Search and filter customer records by location, account status, demographics, and more.
        </Typography>
      </Box>

      {statusMessage && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {statusMessage}
        </Alert>
      )}

      {/* Card 1: Location & Profile */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
            Location &amp; Profile
          </Typography>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 2 }}>
            <TextField
              select
              label="Branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              size="small"
              fullWidth
              disabled={branchesLoading}
              SelectProps={{ displayEmpty: true, renderValue: (v) => v || 'Select a branch' }}
            >
              <MenuItem value="" disabled>Select a branch</MenuItem>
              {branchOptions.map((item) => (
                <MenuItem key={item} value={item}>{item}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              size="small"
              fullWidth
              SelectProps={{ displayEmpty: true, renderValue: (v) => v || 'Select a region' }}
            >
              <MenuItem value="" disabled>Select a region</MenuItem>
              {REGIONS.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="District"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              size="small"
              fullWidth
              placeholder="Enter district"
            />

            <TextField
              label="Ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              size="small"
              fullWidth
              placeholder="Enter ward"
            />

            <TextField
              select
              label="Marital Status"
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
              size="small"
              fullWidth
              SelectProps={{ displayEmpty: true, renderValue: (v) => v || 'Select marital status' }}
            >
              <MenuItem value="" disabled>Select marital status</MenuItem>
              {MARITAL_STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Educational Level"
              value={educationalLevel}
              onChange={(e) => setEducationalLevel(e.target.value)}
              size="small"
              fullWidth
              SelectProps={{ displayEmpty: true, renderValue: (v) => v || 'Select educational level' }}
            >
              <MenuItem value="" disabled>Select educational level</MenuItem>
              {EDUCATION_LEVEL_OPTIONS.map((l) => (
                <MenuItem key={l} value={l}>{l}</MenuItem>
              ))}
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* Card 2: Account Status & Date Ranges */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
            Account Status &amp; Date Ranges
          </Typography>

          {/* Account status checkboxes */}
          <Box sx={{ display: 'flex', gap: 4, mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={activeAccount} onChange={(e) => setActiveAccount(e.target.checked)} />}
              label="Active Customer Account"
            />
            <FormControlLabel
              control={<Checkbox checked={closedAccount} onChange={(e) => setClosedAccount(e.target.checked)} />}
              label="Closed Customer Account"
            />
          </Box>

          {/* Date ranges */}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 2 }}>
            <TextField
              label="Account Open Date From"
              type="date"
              value={openDateFrom}
              onChange={(e) => setOpenDateFrom(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Account Open Date To"
              type="date"
              value={openDateTo}
              onChange={(e) => setOpenDateTo(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <TextField
              label="Account Close Date From"
              type="date"
              value={closeDateFrom}
              onChange={(e) => setCloseDateFrom(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Account Close Date To"
              type="date"
              value={closeDateTo}
              onChange={(e) => setCloseDateTo(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Card 3: Customer Type, Age & Gender */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
            Customer Demographics
          </Typography>

          {/* Customer Type */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#555' }}>
              Customer Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={<Checkbox checked={customerType.individual} onChange={handleCustomerTypeChange} name="individual" />}
                label="Individual"
              />
              <FormControlLabel
                control={<Checkbox checked={customerType.group} onChange={handleCustomerTypeChange} name="group" />}
                label="Group"
              />
              <FormControlLabel
                control={<Checkbox checked={customerType.corporate} onChange={handleCustomerTypeChange} name="corporate" />}
                label="Corporate"
              />
            </Box>
          </Box>

          {/* Age Range */}
          <Box sx={{ mb: 3, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <TextField
              label="Age From"
              type="number"
              value={ageFrom}
              onChange={(e) => setAgeFrom(e.target.value)}
              size="small"
              fullWidth
              inputProps={{ min: 0, max: 120 }}
              placeholder="e.g. 18"
            />
            <TextField
              label="Age To"
              type="number"
              value={ageTo}
              onChange={(e) => setAgeTo(e.target.value)}
              size="small"
              fullWidth
              inputProps={{ min: 0, max: 120 }}
              placeholder="e.g. 60"
            />
          </Box>

          {/* Gender */}
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#555' }}>
              Gender
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <FormControlLabel
                control={<Checkbox checked={gender.male} onChange={handleGenderChange} name="male" />}
                label="Male"
              />
              <FormControlLabel
                control={<Checkbox checked={gender.female} onChange={handleGenderChange} name="female" />}
                label="Female"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Print Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="contained"
          onClick={handlePrint}
          disabled={!branch || branchesLoading}
          sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 4 }}
        >
          Print
        </Button>
      </Box>
    </Box>
  );
}

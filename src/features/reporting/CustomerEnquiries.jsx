import React, { useMemo, useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useBranches } from '../../hooks/useBranches';
import { buildCustomerEnquiriesPrintHtml } from './CustomerEnquiries/printSetup';

const normalizeBranchName = (branch) => (
  branch?.branchName
  || branch?.br_name
  || branch?.name
  || branch?.branch
  || ''
).toString().trim();

const normalizeBranchId = (branch) => (
  branch?.branchId
  || branch?.branchid
  || branch?.br_id
  || branch?.id
  || 0
);

const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];
const EDUCATION_LEVEL_OPTIONS = ['No Formal Education', 'Primary', 'Secondary', 'Vocational / Technical', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'];
const REGIONS = ['West Coast Region', 'Lower River Region', 'North Bank Region', 'Central River Region', 'Upper River Region'];
const ALL_BRANCHES_VALUE = '__ALL_BRANCHES__';

const normalizeReportRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.Table)) return payload.Table;
  if (Array.isArray(payload?.table)) return payload.table;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.Table)) return payload.data.Table;
  if (Array.isArray(payload?.data?.table)) return payload.data.table;
  return [];
};

const normalizeText = (value) => String(value ?? '').trim();

const customerCodeOf = (row) => normalizeText(
  row?.customercode
  || row?.ccustcode
  || row?.cmemberno
  || row?.memberno
  || row?.memberNo
  || row?.cacctnumb,
);

const customerNameOf = (row) => {
  const first = normalizeText(row?.ccustfname);
  const middle = normalizeText(row?.ccustmname);
  const last = normalizeText(row?.ccustlname);
  const full = [first, middle, last].filter(Boolean).join(' ').trim();
  return full || normalizeText(row?.ccustname || row?.customerName || row?.cacctname);
};

const dateJoinedOf = (row) => normalizeText(row?.dateJoined || row?.djoindate || row?.dopendate || row?.dcreatedate);

const genderOf = (row) => {
  const raw = normalizeText(row?.gender || row?.cgender || row?.sex || row?.genderCode);
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (upper === '3' || upper === 'OTHER' || upper === 'O') return 'Other';
  if (upper === 'M' || upper === '1' || upper === 'MALE') return 'Male';
  if (upper === 'F' || upper === '2' || upper === 'FEMALE') return 'Female';
  return raw;
};

const dateOfBirthOf = (row) => normalizeText(row?.dateOfBirth || row?.dob || row?.ddob);

const phoneOf = (row) => normalizeText(row?.phone || row?.telephone || row?.mobile || row?.tel || row?.Expr1);

const escapeCSV = (value) => {
  const str = String(value ?? '');
  return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
};

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default function CustomerEnquiries() {
  const { branches, loading: branchesLoading } = useBranches();

  // Location filters
  const [branch, setBranch] = useState('');
  const [region, setRegion] = useState('');

  // Profile filters
  const [maritalStatus, setMaritalStatus] = useState('');
  const [educationalLevel, setEducationalLevel] = useState('');

  // Account status
  const [activeAccount, setActiveAccount] = useState(false);
  const [closedAccount, setClosedAccount] = useState(false);

  // Date ranges (provide sensible defaults)
  const [openDateFrom, setOpenDateFrom] = useState(() => dayjs('1900-01-01'));
  const [openDateTo, setOpenDateTo] = useState(() => dayjs('2089-12-31'));
  const [closeDateFrom, setCloseDateFrom] = useState(() => dayjs('1900-01-01'));
  const [closeDateTo, setCloseDateTo] = useState(() => dayjs('2089-12-31'));

  // Customer type
  const [customerType, setCustomerType] = useState({
    individual: false,
    group: false,
    corporate: false,
  });

  // Age range (defaults)
  const [ageFrom, setAgeFrom] = useState(0);
  const [ageTo, setAgeTo] = useState(999);

  // Gender
  const [gender, setGender] = useState({
    male: false,
    female: false,
  });

  const [statusMessage, setStatusMessage] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  const branchOptions = useMemo(
    () => Array.from(new Set((Array.isArray(branches) ? branches : []).map(normalizeBranchName).filter(Boolean))),
    [branches],
  );

  const handleCustomerTypeChange = (e) => {
    const { name, checked } = e.target;
    setCustomerType((prev) => ({ ...prev, [name]: checked }));
  };

  const handleActiveAccountChange = (e) => {
    const checked = e.target.checked;
    setActiveAccount(checked);
    if (checked) setClosedAccount(false);
  };

  const handleClosedAccountChange = (e) => {
    const checked = e.target.checked;
    setClosedAccount(checked);
    if (checked) setActiveAccount(false);
  };

  const handleGenderChange = (e) => {
    const { name, checked } = e.target;
    setGender((prev) => ({ ...prev, [name]: checked }));
  };

  const convertToCSV = (rows) => {
    const headers = ['Customer Code', 'Customer Name', 'Date Joined', 'Gender', 'Date of Birth', 'Phone'];
    const csvRows = rows.map((row) => [
      customerCodeOf(row),
      customerNameOf(row),
      dateJoinedOf(row),
      genderOf(row),
      dateOfBirthOf(row),
      phoneOf(row),
    ]);

    return [headers, ...csvRows].map((row) => row.map(escapeCSV).join(',')).join('\n');
  };

  const fetchReportData = async () => {

    const matchedBranch = (Array.isArray(branches) ? branches : []).find(
      (item) => normalizeBranchName(item) === branch,
    );

    const formatDate = (value, fallback) => (value?.format ? value.format('YYYY-MM-DD') : fallback);

    const payload = {
      CustType: customerType.individual ? 1 : 0,
      CustType1: customerType.group ? 2 : 0,
      CustType2: customerType.corporate ? 3 : 0,
      ActiveMember: activeAccount ? 1 : 0,
      CloseMember: closedAccount ? 1 : 0,
      GenderMale: gender.male ? 1 : 0,
      GenderFemale: gender.female ? 2 : 0,
      GenderCode: gender.male && gender.female ? '3' : gender.male ? '1' : gender.female ? '2' : '',
      BranchID: branch === ALL_BRANCHES_VALUE || !branch ? 0 : normalizeBranchId(matchedBranch),
      FromMemberNo: String(Number(ageFrom) || 0),
      ToMemberNo: String(Number(ageTo) || 999),
      OpenFromDate: formatDate(openDateFrom, '1900-01-01'),
      OpenToDate: formatDate(openDateTo, '2089-12-31'),
      ClosedFromDate: formatDate(closeDateFrom, '1900-01-01'),
      ClosedToDate: formatDate(closeDateTo, '2089-12-31'),
    };

    const response = await fetch('/api/memberreport/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch member report.');
    }

    const data = await response.json();
    const rows = normalizeReportRows(data);

    if (rows.length === 0) {
      throw new Error('No customer records found for the selected filters.');
    }

    return { data, rows };
  };

  const handleExportPDF = (data) => {
    const reportHtml = buildCustomerEnquiriesPrintHtml(data);
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow pop-ups and try again.');
    }

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();

    let didPrint = false;
    const triggerPrint = () => {
      if (didPrint || printWindow.closed) return;
      didPrint = true;
      printWindow.focus();
      printWindow.print();
    };

    printWindow.onload = () => {
      triggerPrint();
    };

    window.setTimeout(() => {
      triggerPrint();
    }, 250);
  };

  const handleExportCSV = (rows) => {
    const csvContent = convertToCSV(rows);
    const filename = `customer-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(csvContent, filename, 'text/csv');
  };

  const handleExportExcel = (rows) => {
    const csvContent = convertToCSV(rows);
    const filename = `customer-enquiries-${new Date().toISOString().slice(0, 10)}.xlsx`;
    downloadFile(csvContent, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const handleExport = async (type) => {
    setStatusMessage('');

    try {
      setIsPrinting(true);
      const { data, rows } = await fetchReportData();

      if (type === 'pdf') {
        handleExportPDF(data);
      } else if (type === 'excel') {
        handleExportExcel(rows);
      } else if (type === 'csv') {
        handleExportCSV(rows);
      }
    } catch (error) {
      setStatusMessage(error.message || 'Failed to fetch member report.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleClear = () => {
    setBranch('');
    setRegion('');
    // District and Ward removed
    setMaritalStatus('');
    setEducationalLevel('');
    setActiveAccount(false);
    setClosedAccount(false);
    setOpenDateFrom(dayjs('1900-01-01'));
    setOpenDateTo(dayjs('2089-12-31'));
    setCloseDateFrom(dayjs('1900-01-01'));
    setCloseDateTo(dayjs('2089-12-31'));
    setCustomerType({ individual: false, group: false, corporate: false });
    setAgeFrom(0);
    setAgeTo(999);
    setGender({ male: false, female: false });
    setStatusMessage('');
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

      {/* Two Column Layout: Location & Profile & Account Status & Date Ranges */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
        {/* Card 1: Location & Profile */}
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (v) => {
                    if (!v) return 'All Branches';
                    if (v === ALL_BRANCHES_VALUE) return 'All Branches';
                    return v;
                  },
                }}
              >
                <MenuItem value="">All Branches</MenuItem>
                <MenuItem value={ALL_BRANCHES_VALUE}>All Branches</MenuItem>
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

              {/* District and Ward fields hidden for now */}

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
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
              Account Status &amp; Date Ranges
            </Typography>

            {/* Account status checkboxes */}
            <Box sx={{ display: 'flex', gap: 4, mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <FormControlLabel
                control={<Checkbox checked={activeAccount} onChange={handleActiveAccountChange} disabled={closedAccount} />}
                label="Active Customer Account"
              />
              <FormControlLabel
                control={<Checkbox checked={closedAccount} onChange={handleClosedAccountChange} />}
                label="Closed Customer Account"
                disabled={activeAccount}
              />
            </Box>

            {/* Date ranges */}
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, mb: 2 }}>
              <DatePicker
                label="Account Open Date From"
                value={openDateFrom}
                onChange={(date) => setOpenDateFrom(date)}
                slotProps={{
                  textField: { size: 'small', fullWidth: true },
                }}
              />
              <DatePicker
                label="Account Open Date To"
                value={openDateTo}
                onChange={(date) => setOpenDateTo(date)}
                slotProps={{
                  textField: { size: 'small', fullWidth: true },
                }}
              />
            </Box>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
              <DatePicker
                label="Account Close Date From"
                value={closeDateFrom}
                onChange={(date) => setCloseDateFrom(date)}
                slotProps={{
                  textField: { size: 'small', fullWidth: true },
                }}
              />
              <DatePicker
                label="Account Close Date To"
                value={closeDateTo}
                onChange={(date) => setCloseDateTo(date)}
                slotProps={{
                  textField: { size: 'small', fullWidth: true },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Card 3: Customer Demographics */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, mb: 3 }}>
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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
                onChange={(e) => setAgeFrom(Number(e.target.value))}
                size="small"
                fullWidth
                inputProps={{ min: 0, max: 999 }}
                placeholder="e.g. 18"
              />
              <TextField
                label="Age To"
                type="number"
                value={ageTo}
                onChange={(e) => setAgeTo(Number(e.target.value))}
                size="small"
                fullWidth
                inputProps={{ min: 0, max: 999 }}
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
      </Box>

      {/* Export Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={() => handleExport('pdf')}
          disabled={isPrinting}
          sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5568d3' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 4 }}
        >
          PDF
        </Button>
        <Button
          variant="contained"
          onClick={() => handleExport('excel')}
          disabled={isPrinting}
          sx={{ backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
        >
          Excel
        </Button>
        <Button
          variant="contained"
          onClick={() => handleExport('csv')}
          disabled={isPrinting}
          sx={{ backgroundColor: '#0ea5e9', '&:hover': { backgroundColor: '#0284c7' }, fontWeight: 600, textTransform: 'none', boxShadow: 'none', px: 3 }}
        >
          CSV
        </Button>
        <Button
          variant="text"
          onClick={handleClear}
          disabled={isPrinting}
          sx={{ fontWeight: 600, textTransform: 'none' }}
        >
          Clear
        </Button>
      </Box>

      <Backdrop
        open={isPrinting}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body2">Preparing report...</Typography>
      </Backdrop>
    </Box>
  );
}


import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useRegisterInstitution } from './hooks/useRegisterInstitution';
import { useRegisterIndividual } from './hooks/useRegisterIndividual';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';
import { useCities } from './hooks/useCities';
import { initialForm } from './constants/initialFormData';
import { buildIndividualPayload, buildInstitutionPayload } from './constants/payloadBuilders';

// Tab group styles
const mainTabGroupSx = {
  minHeight: 52,
  mb: 2,
  p: 0.6,
  borderRadius: 2.5,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'action.hover',
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTab-root': {
    minHeight: 38,
    textTransform: 'none',
    borderRadius: 1.75,
    fontWeight: 700,
    fontSize: '0.95rem',
    color: 'text.secondary',
    px: 2,
    transition: 'all 0.2s ease',
  },
  '& .MuiTab-root:hover': {
    color: 'text.primary',
    bgcolor: 'action.selected',
  },
  '& .MuiTab-root.Mui-selected': {
    color: 'primary.main',
    bgcolor: 'background.paper',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.10)',
  },
};

const detailTabGroupSx = {
  minHeight: 50,
  mb: 2,
  p: 0.6,
  borderRadius: 2,
  bgcolor: 'action.hover',
  border: '1px solid',
  borderColor: 'divider',
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTab-root': {
    minHeight: 36,
    textTransform: 'none',
    borderRadius: 1.5,
    fontWeight: 600,
    fontSize: '0.88rem',
    color: 'text.secondary',
    px: 1.8,
    transition: 'all 0.2s ease',
  },
  '& .MuiTab-root:hover': {
    color: 'text.primary',
    bgcolor: 'action.selected',
  },
  '& .MuiTab-root.Mui-selected': {
    color: 'primary.main',
    bgcolor: 'background.paper',
    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
  },
};

export default function CustomerRegistration(props) {
  const { registerInstitution } = useRegisterInstitution();
  const { registerIndividual } = useRegisterIndividual();
  const { cities } = useCities();
  // If you need user, get it from props.user, else remove
  const user = props.user;
  const isReadOnlyRole = Boolean(user?.access?.readOnly);
  const [recentMember, setRecentMember] = useState(null);
  const [mainTab, setMainTab] = useState(0);
  const [detailTab, setDetailTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [reportData, setReportData] = useState(null);
  const [institutionBranches, setInstitutionBranches] = useState([]);
  const [countries, setCountries] = useState([]);

  // Fetch institution branches for branch dropdowns
  useEffect(() => {
    const loadInstitutionBranches = async () => {
      try {
        const response = await fetch('/api/remote-branches/branches');
        if (!response.ok) return;
        const payload = await response.json();
        const branchOptions = Array.from(
          new Set(
            (Array.isArray(payload) ? payload : [])
              .map((item) => (item?.br_name || item?.branchName || item?.name || '').trim())
              .filter(Boolean)
          )
        );
        setInstitutionBranches(branchOptions);
      } catch {
        setInstitutionBranches([]);
      }
    };
    loadInstitutionBranches();
  }, []);

  // Fetch countries for nationality and country of residence
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch('/api/remote-countries/countries');
        if (!response.ok) return;
        const payload = await response.json();
        const countryOptions = (Array.isArray(payload) ? payload : [])
          .map((item) => ({
            id: item.cou_id || item.id || 0,
            name: (item.cou_name || '').trim(),
          }))
          .filter((item) => item.name && item.id)
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryOptions);
      } catch {
        setCountries([]);
      }
    };
    loadCountries();
  }, []);

  // Columns for Recently Registered Member DataGrid
const recentMemberColumns = [
  { field: 'memberCode', headerName: 'Customer Code', flex: 1, minWidth: 120 },
  { field: 'fullName', headerName: 'First Name and Surname', flex: 1.5, minWidth: 180 },
  { field: 'dateJoined', headerName: 'Date Joined', flex: 1, minWidth: 140 },
  { field: 'dateOfBirth', headerName: 'Date of Birthday', flex: 1, minWidth: 140 },
  { field: 'branch', headerName: 'Branch', flex: 1, minWidth: 120 },
];

// Helper to format row for DataGrid
function formatRecentMemberRow(row, institutionBranches = []) {
  if (!row) return {};
  // Helper to format date
  function formatDate(dateStr) {
    if (!dateStr || dateStr === '1900-01-01T00:00:00') return '';
    // Accept both string and Date
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  // Try all possible date fields for join and birth
  const dateJoinedRaw = row.dateJoined || row.date_joined || row.datejoin || row.ddatejoin;
  const dateOfBirthRaw = row.dateOfBirth || row.date_of_birth || row.ddatebirth || row.dob;

  // Branch: try string, fallback to branch id (number)
  let branchVal = row.branch || row.bracnh || row.branchid || row.branch_id || '';
  // If branchVal is a number and institutionBranches is available, map to branch name
  if (typeof branchVal === 'number' && Array.isArray(institutionBranches) && institutionBranches.length > 0) {
    // Assume branchVal is 1-based index or matches the order in institutionBranches
    // If your branch IDs map differently, adjust this logic accordingly
    if (branchVal > 0 && branchVal <= institutionBranches.length) {
      branchVal = institutionBranches[branchVal - 1] || branchVal.toString();
    } else {
      branchVal = branchVal.toString();
    }
  }
  if (typeof branchVal === 'number' && branchVal === 0) branchVal = '';

  return {
    memberCode:
      row.memberCode || row.clientCode || row.ccustcode || row.custcode || '',
    fullName:
      (row.firstName || row.ccustfname || '').trim() +
      ' ' +
      (row.surname || row.ccustlname || '').trim(),
    dateJoined: formatDate(dateJoinedRaw),
    dateOfBirth: formatDate(dateOfBirthRaw),
    branch: branchVal,
    id:
      row.memberCode || row.clientCode || row.ccustcode || row.custcode || Math.random(),
  };
}

  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState('');
  const [additionalReferences, setAdditionalReferences] = useState([]);
  const [additionalNextOfKins, setAdditionalNextOfKins] = useState([]);

  const [formData, setFormData] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setStatusMessage('');
    setStatusError(false);
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDateChange = (name, value) => {
    setStatusMessage('');
    setStatusError(false);
    setFormData((prev) => ({
      ...prev,
      [name]: value ? value.format('YYYY-MM-DD') : '',
    }));
  };

  const handleBiometricFileChange = (fieldName, event) => {
    const selectedFile = event.target.files?.[0] || null;
    setStatusMessage('');
    setStatusError(false);

    if (fieldName === 'biometricPhotoName') {
      setPhotoPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return selectedFile ? URL.createObjectURL(selectedFile) : '';
      });
    }

    if (fieldName === 'biometricSignatureName') {
      setSignaturePreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return selectedFile ? URL.createObjectURL(selectedFile) : '';
      });
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: selectedFile ? selectedFile.name : '',
    }));
  };

  const handleRemoveBiometricFile = (fieldName) => {
    setStatusMessage('');
    setStatusError(false);

    if (fieldName === 'biometricPhotoName') {
      setPhotoPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return '';
      });
    }

    if (fieldName === 'biometricSignatureName') {
      setSignaturePreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return '';
      });
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: '',
    }));
  };

  const handleAddReferenceCard = () => {
    setAdditionalReferences((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        address: '',
        mobilePhone: '',
        emailAddress: '',
      },
    ]);
  };

  const handleAdditionalReferenceChange = (id, field, value) => {
    setAdditionalReferences((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleAddNextOfKinCard = () => {
    setAdditionalNextOfKins((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        address: '',
        relationship: '',
        mobilePhone: '',
      },
    ]);
  };

  const handleAdditionalNextOfKinChange = (id, field, value) => {
    setAdditionalNextOfKins((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleSave = async () => {

    if (isReadOnlyRole || isSaving) {
      return;
    }

    // Validation (unchanged)

    if (mainTab === 0) {
      // Individual tab: map fields to backend payload and call useRegisterIndividual
      const individualPayload = buildIndividualPayload(formData, countries, cities);
      try {
        await registerIndividual(individualPayload);
        setStatusMessage('Individual registration saved successfully.');
        notifySaveSuccess({
          page: 'Member Administration / Registration',
          action: 'Save Individual Registration',
          message: 'Individual registration saved successfully.',
          metadata: individualPayload,
        });
        setFormData(initialForm);
        setAdditionalReferences([]);
        setAdditionalNextOfKins([]);
        setPhotoPreviewUrl('');
        setSignaturePreviewUrl('');
        setIsSaving(false);
        return;
      } catch (error) {
        setStatusMessage('Unable to save individual registration.');
        setStatusError(true);
        notifySaveError({
          page: 'Member Administration / Registration',
          action: 'Save Individual Registration',
          message: 'Unable to save individual registration.',
          error,
          metadata: individualPayload,
        });
        setIsSaving(false);
        return;
      }
    } else {
      // ...existing code for institution...
    }

    setFieldErrors({});
    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    let institutionPayload = null;
    if (mainTab === 1) {
      // Institution tab: map fields to backend payload and call useRegisterInstitution
      institutionPayload = buildInstitutionPayload(formData, institutionBranches, cities);
        // TODO: Map branch_id, cou_id, ncity, nrel, nregion, ndist, nward, bat_id from dropdowns if available
        // Call useRegisterInstitution
      try {
        const response = await registerInstitution(institutionPayload);
        // If backend returns companyId, set it in formData
        if (response && response.companyId) {
          setFormData((prev) => ({ ...prev, companyId: response.companyId }));
        }
        setStatusMessage('Institution registration saved successfully.');
        notifySaveSuccess({
          page: 'Member Administration / Registration',
          action: 'Save Institution Registration',
          message: 'Institution registration saved successfully.',
          metadata: institutionPayload,
        });
        setFormData(initialForm);
        setAdditionalReferences([]);
        setAdditionalNextOfKins([]);
        setPhotoPreviewUrl('');
        setSignaturePreviewUrl('');
        setRecentMember(null);
        setIsSaving(false);
        return;
      } catch (error) {
        setStatusMessage('Unable to save customer registration.');
        setStatusError(true);
        notifySaveError({
          page: 'Member Administration / Registration',
          action: 'Save Customer Registration',
          message: 'Unable to save customer registration.',
          error,
          metadata: institutionPayload,
        });
        setIsSaving(false);
        return;
      }
    }
    // ...existing code for individual...
  };

  const handleGenerateReport = async () => {
    if (isReadOnlyRole || isGeneratingReport) {
      return;
    }

    setIsGeneratingReport(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      const response = await fetch('/api/customer-registration/report');
      if (!response.ok) {
        throw new Error('Report generation failed');
      }

      const payload = await response.json();
      setReportData(payload?.report || null);
      setStatusMessage('Report generated successfully.');
    } catch {
      setStatusMessage('Unable to generate customer registration report.');
      setStatusError(true);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Registration Individual or Institution
      </Typography>

      {statusMessage && (
        <Typography
          variant="body2"
          color={statusError ? 'error.main' : 'success.main'}
          sx={{ mb: 2, fontWeight: 700 }}
        >
          {statusMessage}
        </Typography>
      )}

      <Tabs
        value={mainTab}
        onChange={(_, nextTab) => setMainTab(nextTab)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={mainTabGroupSx}
      >
        <Tab label="Individual" />
        <Tab label="Institution" />
      </Tabs>

      {(mainTab === 0 || mainTab === 1) && (
        <Box
          component="fieldset"
          disabled={isReadOnlyRole}
          sx={{
            border: 'none',
            p: 0,
            m: 0,
            opacity: isReadOnlyRole ? 0.55 : 1,
            pointerEvents: isReadOnlyRole ? 'none' : 'auto',
            '& .MuiInputLabel-root, & .MuiFormLabel-root': {
              fontWeight: 600,
              fontSize: '1.2rem',
            },
            '& .MuiFormLabel-asterisk': {
              color: 'error.main',
              fontSize: '2rem',
              fontWeight: 800,
            },
          }}
        >
          <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              {mainTab === 0 ? (
                <>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
                    <TextField
                      required
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      error={Boolean(fieldErrors.firstName)}
                    />
                    <TextField label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
                    <TextField
                      required
                      label="Surname"
                      name="surname"
                      value={formData.surname}
                      onChange={handleChange}
                      error={Boolean(fieldErrors.surname)}
                    />
                    <TextField
                      label="Customer Code"
                      name="memberCode"
                      value={formData.memberCode}
                      InputProps={{ readOnly: true }}
                      sx={{
                        '& .MuiInputBase-input': {
                          backgroundColor: '#f0f0f0',
                        },
                      }}
                    />
                    <TextField
                      select
                      required
                      label="Branch"
                      name="institutionBranch"
                      value={formData.institutionBranch}
                      onChange={handleChange}
                      error={Boolean(fieldErrors.institutionBranch)}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (selected) => selected || 'Select branch',
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select branch
                      </MenuItem>
                      {institutionBranches.map((item) => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={<Checkbox name="memberEmployed" checked={formData.memberEmployed} onChange={handleChange} />}
                      label="Member is Employed"
                    />
                    <FormControlLabel
                      control={<Checkbox name="sendSms" checked={formData.sendSms} onChange={handleChange} />}
                      label="Check to Send SMS"
                    />
                    <FormControlLabel
                      control={<Checkbox name="registerMobileWallet" checked={formData.registerMobileWallet} onChange={handleChange} />}
                      label="Register member for Mobile Wallet"
                    />
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <TextField
                      select
                      required
                      label="Institution Type"
                      name="institutionType"
                      value={formData.institutionType}
                      onChange={handleChange}
                      error={Boolean(fieldErrors.institutionType)}
                    >
                      <MenuItem value="corporate">Corporate</MenuItem>
                      <MenuItem value="group">Group</MenuItem>
                    </TextField>
                    <TextField
                      required
                      label="Institution Name"
                      name="institutionName"
                      value={formData.institutionName}
                      onChange={handleChange}
                      error={Boolean(fieldErrors.institutionName)}
                    />
                    <TextField
                      select
                      required
                      label="Business Category"
                      name="institutionNature"
                      value={formData.institutionNature}
                      onChange={handleChange}
                      error={Boolean(fieldErrors.institutionNature)}
                    >
                      <MenuItem value="">Select business category</MenuItem>
                      <MenuItem value={1}>Business</MenuItem>
                      <MenuItem value={2}>Association</MenuItem>
                      <MenuItem value={3}>NGO</MenuItem>
                      <MenuItem value={4}>Cooperative</MenuItem>
                    </TextField>
                    <TextField
                      label="Customer Code"
                      name="institutionMemberCode"
                      value={formData.institutionMemberCode}
                      InputProps={{ readOnly: true }}
                      sx={{
                        '& .MuiInputBase-input': {
                          backgroundColor: '#f0f0f0',
                        },
                      }}
                    />
                    {/* Company ID and Branch ID fields removed: set from backend/API only */}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Tabs
                value={detailTab}
                onChange={(_, nextTab) => setDetailTab(nextTab)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={detailTabGroupSx}
              >
                <Tab label="Basic Details" />
                <Tab label={mainTab === 1 ? 'Representative' : 'Contact Details'} />
                <Tab label={mainTab === 1 ? 'Reference' : 'Employment Detail'} />
                <Tab label="Contribution" />
                <Tab label="Biometric" />
              </Tabs>

              {detailTab === 0 && (
                mainTab === 1 ? (
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Info
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            select
                            required
                            label="Country"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.country)}
                          >
                            <MenuItem value="">Select country</MenuItem>
                            {countries.map((country) => (
                              <MenuItem key={country.id} value={country.id}>
                                {country.name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            required
                            label="City"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.city)}
                          >
                            <MenuItem value="">Select city</MenuItem>
                            {cities.map((city) => (
                              <MenuItem key={`city-${city.id}-${city.name}`} value={city.name}>
                                {city.name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            required
                            label="Street"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.address)}
                          />
                          <TextField
                            required
                            label="Tel"
                            name="mobilePhoneNumber"
                            value={formData.mobilePhoneNumber}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.mobilePhoneNumber)}
                          />
                          <TextField
                            label="Tel1"
                            name="tel1"
                            value={formData.tel1 || ''}
                            onChange={handleChange}
                          />
                          <TextField
                            label="Email"
                            name="emailAddress"
                            value={formData.emailAddress}
                            onChange={handleChange}
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />

                          <FormControl sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                            <FormLabel>Residency</FormLabel>
                            <RadioGroup row name="institutionResidency" value={formData.institutionResidency} onChange={handleChange}>
                              <FormControlLabel value="resident" control={<Radio />} label="Resident" />
                              <FormControlLabel value="non-resident" control={<Radio />} label="Non Residence" />
                            </RadioGroup>
                          </FormControl>
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Institution Details
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            required
                            label="Incoporation Number"
                            name="institutionIncoporationNumber"
                            value={formData.institutionIncoporationNumber}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.institutionIncoporationNumber)}
                          />
                          <TextField
                            required
                            label="TIN"
                            name="institutionTIN"
                            value={formData.institutionTIN}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.institutionTIN)}
                          />
                          <DatePicker
                            required
                            label="Incoporation date"
                            value={formData.institutionIncoporationDate ? dayjs(formData.institutionIncoporationDate) : null}
                            onChange={(value) => handleDateChange('institutionIncoporationDate', value)}
                            disableFuture
                            slotProps={{ textField: { name: 'institutionIncoporationDate', required: true } }}
                          />
                          <DatePicker
                            required
                            label="Date joined"
                            value={formData.institutionDateJoined ? dayjs(formData.institutionDateJoined) : null}
                            onChange={(value) => handleDateChange('institutionDateJoined', value)}
                            disableFuture
                            slotProps={{ textField: { name: 'institutionDateJoined', required: true } }}
                          />
                          <TextField
                            select
                            required
                            label="Region"
                            name="institutionRegion"
                            value={formData.institutionRegion}
                            onChange={handleChange}
                          >
                            <MenuItem value="">Select region</MenuItem>
                            <MenuItem value={1}>Banjul</MenuItem>
                            <MenuItem value={2}>Kanifing</MenuItem>
                            <MenuItem value={3}>West Coast</MenuItem>
                            <MenuItem value={4}>North Bank</MenuItem>
                            <MenuItem value={5}>Lower River</MenuItem>
                            <MenuItem value={6}>Central River</MenuItem>
                            <MenuItem value={7}>Upper River</MenuItem>
                          </TextField>
                          <TextField
                            select
                            required
                            label="District"
                            name="institutionDistrict"
                            value={formData.institutionDistrict}
                            onChange={handleChange}
                          >
                            <MenuItem value="">Select district</MenuItem>
                            <MenuItem value={1}>Banjul</MenuItem>
                            <MenuItem value={2}>Kanifing</MenuItem>
                            <MenuItem value={3}>Kombo North</MenuItem>
                            <MenuItem value={4}>Kombo South</MenuItem>
                          </TextField>
                          <TextField
                            select
                            required
                            label="Ward"
                            name="institutionWard"
                            value={formData.institutionWard}
                            onChange={handleChange}
                          >
                            <MenuItem value="">Select ward</MenuItem>
                            <MenuItem value={1}>Ward 1</MenuItem>
                            <MenuItem value={2}>Ward 2</MenuItem>
                            <MenuItem value={3}>Ward 3</MenuItem>
                            <MenuItem value={4}>Ward 4</MenuItem>
                          </TextField>

                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Personal Profile
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            required
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.title)}
                          />
                          <TextField
                            select
                            required
                            label="Gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.gender)}
                          >
                            <MenuItem value={1}>Male</MenuItem>
                            <MenuItem value={2}>Female</MenuItem>
                          </TextField>
                          <TextField
                              required
                              select
                              label="Nationality"
                              name="nationality"
                              value={formData.nationality}
                              onChange={handleChange}
                              error={Boolean(fieldErrors.nationality)}
                            >
                              <MenuItem value="">Select nationality</MenuItem>
                              {countries.map((country) => (
                                <MenuItem key={`nationality-${country.id}-${country.name}`} value={country.name}>{country.name}</MenuItem>
                              ))}
                            </TextField>
                          <TextField label="Tribe" name="tribe" value={formData.tribe} onChange={handleChange} />
                          <TextField label="Level of Education" name="levelOfEducation" value={formData.levelOfEducation} onChange={handleChange} />
                          <TextField
                            select
                            required
                            label="Marital status"
                            name="maritalStatus"
                            value={formData.maritalStatus}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.maritalStatus)}
                          >
                            <MenuItem value="single">Single</MenuItem>
                            <MenuItem value="married">Married</MenuItem>
                            <MenuItem value="divorced">Divorced</MenuItem>
                            <MenuItem value="widowed">Widowed</MenuItem>
                          </TextField>
                          <DatePicker
                            label="Date of Birth"
                            required
                            value={formData.dateOfBirth ? dayjs(formData.dateOfBirth) : null}
                            onChange={(value) => handleDateChange('dateOfBirth', value)}
                            disableFuture
                            slotProps={{ textField: { name: 'dateOfBirth', required: true } }}
                          />
                          <DatePicker
                            label="Date Joined"
                            required
                            value={formData.dateJoined ? dayjs(formData.dateJoined) : null}
                            onChange={(value) => handleDateChange('dateJoined', value)}
                            disableFuture
                            slotProps={{ textField: { name: 'dateJoined', required: true } }}
                          />
                          <TextField select label="Income Range" name="povertyLevel" value={formData.povertyLevel} onChange={handleChange}>
                            <MenuItem value="0-5000">0 - 5,000</MenuItem>
                            <MenuItem value="5001-10000">5,001 - 10,000</MenuItem>
                            <MenuItem value="10001-25000">10,001 - 25,000</MenuItem>
                            <MenuItem value="25001-50000">25,001 - 50,000</MenuItem>
                            <MenuItem value="50001+">50,001+</MenuItem>
                          </TextField>
                          <FormControl sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                            <FormLabel>Resident Type</FormLabel>
                            <RadioGroup row name="residency" value={formData.residency} onChange={handleChange}>
                              <FormControlLabel value="resident" control={<Radio />} label="Resident" />
                              <FormControlLabel value="non-resident" control={<Radio />} label="Non Resident" />
                            </RadioGroup>
                          </FormControl>
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Identity And Location
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            select
                            required
                            label="ID Type"
                            name="idType"
                            value={formData.idType}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.idType)}
                          >
                            <MenuItem value="national-id">National ID</MenuItem>
                            <MenuItem value="passport">Passport</MenuItem>
                            <MenuItem value="driver-license">Driver License</MenuItem>
                          </TextField>
                          <TextField
                            required
                            label="ID number"
                            name="idNumber"
                            value={formData.idNumber}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.idNumber)}
                          />
                          <TextField
                            required
                            label="Place Issued"
                            name="placeIssue"
                            value={formData.placeIssue}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.placeIssue)}
                          />
                          <DatePicker
                            label="Date Issued"
                            required
                            value={formData.dateIssued ? dayjs(formData.dateIssued) : null}
                            onChange={(value) => handleDateChange('dateIssued', value)}
                            disableFuture
                            slotProps={{ textField: { name: 'dateIssued', required: true } }}
                          />
                          <DatePicker
                            label="Expiry Date"
                            required
                            value={formData.expiryDate ? dayjs(formData.expiryDate) : null}
                            onChange={(value) => handleDateChange('expiryDate', value)}
                            slotProps={{ textField: { name: 'expiryDate', required: true } }}
                          />
                          <TextField
                            select
                            label="Region"
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                          >
                            <MenuItem value="">Select region</MenuItem>
                            <MenuItem value={1}>Banjul</MenuItem>
                            <MenuItem value={2}>Kanifing</MenuItem>
                            <MenuItem value={3}>West Coast</MenuItem>
                            <MenuItem value={4}>North Bank</MenuItem>
                            <MenuItem value={5}>Lower River</MenuItem>
                            <MenuItem value={6}>Central River</MenuItem>
                            <MenuItem value={7}>Upper River</MenuItem>
                          </TextField>
                          <TextField
                            select
                            label="District"
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                          >
                            <MenuItem value="">Select district</MenuItem>
                            <MenuItem value={1}>Banjul</MenuItem>
                            <MenuItem value={2}>Kanifing</MenuItem>
                            <MenuItem value={3}>Kombo North</MenuItem>
                            <MenuItem value={4}>Kombo South</MenuItem>
                          </TextField>
                          <TextField
                            select
                            label="Ward"
                            name="ward"
                            value={formData.ward}
                            onChange={handleChange}
                          >
                            <MenuItem value="">Select ward</MenuItem>
                            <MenuItem value={1}>Ward 1</MenuItem>
                            <MenuItem value={2}>Ward 2</MenuItem>
                            <MenuItem value={3}>Ward 3</MenuItem>
                            <MenuItem value={4}>Ward 4</MenuItem>
                          </TextField>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )
              )}

              {detailTab === 1 && mainTab === 1 && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Chair
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            required
                            label="Name"
                            name="chairName"
                            value={formData.chairName}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.chairName)}
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                          <TextField label="TIN" name="chairTIN" value={formData.chairTIN} onChange={handleChange} />
                          <TextField
                            required
                            label="Mobile Phone"
                            name="chairMobilePhone"
                            value={formData.chairMobilePhone}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.chairMobilePhone)}
                          />
                          <TextField
                            required
                            label="Email Address"
                            name="chairEmailAddress"
                            value={formData.chairEmailAddress}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.chairEmailAddress)}
                          />
                          <FormControlLabel
                            control={<Checkbox name="chairAccountSignatory" checked={formData.chairAccountSignatory} onChange={handleChange} />}
                            label="Account Signatory"
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Vice Chair
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField label="Name" name="viceChairName" value={formData.viceChairName} onChange={handleChange} sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }} />
                          <TextField label="TIN" name="viceChairTIN" value={formData.viceChairTIN} onChange={handleChange} />
                          <TextField label="Mobile Phone" name="viceChairMobilePhone" value={formData.viceChairMobilePhone} onChange={handleChange} />
                          <TextField label="Email Address" name="viceChairEmailAddress" value={formData.viceChairEmailAddress} onChange={handleChange} />
                          <FormControlLabel
                            control={<Checkbox name="viceChairAccountSignatory" checked={formData.viceChairAccountSignatory} onChange={handleChange} />}
                            label="Account Signatory"
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Treasurer
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            required
                            label="Name"
                            name="treasurerName"
                            value={formData.treasurerName}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.treasurerName)}
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                          <TextField label="TIN" name="treasurerTIN" value={formData.treasurerTIN} onChange={handleChange} />
                          <TextField
                            required
                            label="Mobile Phone"
                            name="treasurerMobilePhone"
                            value={formData.treasurerMobilePhone}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.treasurerMobilePhone)}
                          />
                          <TextField
                            required
                            label="Email Address"
                            name="treasurerEmailAddress"
                            value={formData.treasurerEmailAddress}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.treasurerEmailAddress)}
                          />
                          <FormControlLabel
                            control={<Checkbox name="treasurerAccountSignatory" checked={formData.treasurerAccountSignatory} onChange={handleChange} />}
                            label="Account Signatory"
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Secretary
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField label="Name" name="secretaryName" value={formData.secretaryName} onChange={handleChange} sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }} />
                          <TextField label="TIN" name="secretaryTIN" value={formData.secretaryTIN} onChange={handleChange} />
                          <TextField label="Mobile Phone" name="secretaryMobilePhone" value={formData.secretaryMobilePhone} onChange={handleChange} />
                          <TextField label="Email Address" name="secretaryEmailAddress" value={formData.secretaryEmailAddress} onChange={handleChange} />
                          <FormControlLabel
                            control={<Checkbox name="secretaryAccountSignatory" checked={formData.secretaryAccountSignatory} onChange={handleChange} />}
                            label="Account Signatory"
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              )}

              {detailTab === 1 && mainTab === 0 && (
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                        Info
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                        <TextField
                                  select
                                  required
                                  label="Country of Residence"
                                  name="country"
                                  value={formData.country}
                                  onChange={handleChange}
                                  error={Boolean(fieldErrors.country)}
                                >
                                  <MenuItem value="">Select country</MenuItem>
                                  {countries.map((country) => (
                                    <MenuItem key={country.id} value={country.id}>{country.name}</MenuItem>
                                  ))}
                                </TextField>
                        <TextField select label="City" name="city" value={formData.city} onChange={handleChange}>
                          <MenuItem value="">Select city</MenuItem>
                          {cities.map((city) => (
                            <MenuItem key={`city-${city.id}-${city.name}`} value={city.name}>{city.name}</MenuItem>
                          ))}
                        </TextField>
                        <TextField label="Address" name="address" value={formData.address} onChange={handleChange} />
                        <TextField
                          required
                          label="Mobile Phone number"
                          name="mobilePhoneNumber"
                          value={formData.mobilePhoneNumber}
                          onChange={handleChange}
                          error={Boolean(fieldErrors.mobilePhoneNumber)}
                        />
                        <TextField label="Email address" name="emailAddress" value={formData.emailAddress} onChange={handleChange} sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }} />
                      </Box>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                        Referee's Contact Details
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                        <TextField label="Name" name="refereeName" value={formData.refereeName} onChange={handleChange} />
                        <TextField label="Address" name="refereeAddress" value={formData.refereeAddress} onChange={handleChange} />
                        <TextField label="Mobile Phone" name="refereeMobilePhone" value={formData.refereeMobilePhone} onChange={handleChange} />
                        <TextField label="Email address" name="refereeEmailAddress" value={formData.refereeEmailAddress} onChange={handleChange} />
                      </Box>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          Next of kin Details
                        </Typography>
                        <Button variant="outlined" size="small" onClick={handleAddNextOfKinCard}>
                          Add More Next of Kin
                        </Button>
                      </Box>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                        <TextField
                          required
                          label="Name"
                          name="nextOfKinName"
                          value={formData.nextOfKinName}
                          onChange={handleChange}
                          error={Boolean(fieldErrors.nextOfKinName)}
                        />
                        <TextField label="Address" name="nextOfKinAddress" value={formData.nextOfKinAddress} onChange={handleChange} />
                        <TextField label="Relationship" name="nextOfKinRelationship" value={formData.nextOfKinRelationship} onChange={handleChange} />
                        <TextField label="Mobile Phone" name="nextOfKinMobilePhone" value={formData.nextOfKinMobilePhone} onChange={handleChange} />
                      </Box>
                    </CardContent>
                  </Card>

                  {additionalNextOfKins.map((nextOfKin, index) => (
                    <Card key={nextOfKin.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Next of kin Details {index + 2}
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            label="Name"
                            value={nextOfKin.name}
                            onChange={(event) => handleAdditionalNextOfKinChange(nextOfKin.id, 'name', event.target.value)}
                          />
                          <TextField
                            label="Address"
                            value={nextOfKin.address}
                            onChange={(event) => handleAdditionalNextOfKinChange(nextOfKin.id, 'address', event.target.value)}
                          />
                          <TextField
                            label="Relationship"
                            value={nextOfKin.relationship}
                            onChange={(event) => handleAdditionalNextOfKinChange(nextOfKin.id, 'relationship', event.target.value)}
                          />
                          <TextField
                            label="Mobile Phone"
                            value={nextOfKin.mobilePhone}
                            onChange={(event) => handleAdditionalNextOfKinChange(nextOfKin.id, 'mobilePhone', event.target.value)}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {detailTab === 3 && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Registration
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2 }}>
                          <FormControl>
                            <FormLabel>Saving Type</FormLabel>
                            <RadioGroup row name="savingMode" value={formData.savingMode} onChange={handleChange}>
                              <FormControlLabel value="fixed" control={<Radio />} label="Fixed" />
                              <FormControlLabel value="varible" control={<Radio />} label="Variable" />
                            </RadioGroup>
                          </FormControl>
                          <TextField
                            label="Registration Fee"
                            name="registrationFee"
                            value={formData.registrationFee}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.registrationFee)}
                          />
                          <TextField
                            label="Saving Amount"
                            name="savingAmount"
                            value={formData.savingAmount}
                            onChange={handleChange}
                          />
                          <TextField
                            label="Share Price"
                            name="sharePrice"
                            value={formData.sharePrice}
                            onChange={handleChange}
                            disabled
                            sx={{
                              '& .MuiInputBase-root.Mui-disabled': {
                                bgcolor: 'action.disabledBackground',
                              },
                              '& .MuiInputBase-input.Mui-disabled': {
                                WebkitTextFillColor: (theme) => theme.palette.text.disabled,
                              },
                            }}
                          />
                          <TextField
                            label="Share Purchased"
                            name="sharesPurchase"
                            value={formData.sharesPurchase}
                            onChange={handleChange}
                            disabled
                            sx={{
                              '& .MuiInputBase-root.Mui-disabled': {
                                bgcolor: 'action.disabledBackground',
                              },
                              '& .MuiInputBase-input.Mui-disabled': {
                                WebkitTextFillColor: (theme) => theme.palette.text.disabled,
                              },
                            }}
                          />
                          <TextField
                            label="Share Value"
                            name="shareValue"
                            value={formData.shareValue}
                            onChange={handleChange}
                            disabled
                            sx={{
                              '& .MuiInputBase-root.Mui-disabled': {
                                bgcolor: 'action.disabledBackground',
                              },
                              '& .MuiInputBase-input.Mui-disabled': {
                                WebkitTextFillColor: (theme) => theme.palette.text.disabled,
                              },
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Account Signatories
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2 }}>
                          <TextField
                            required
                            label="Signatory 1"
                            name="signatory1"
                            value={formData.signatory1}
                            onChange={handleChange}
                            error={Boolean(fieldErrors.signatory1)}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              )}

              {detailTab === 2 && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Employer Details
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField select label="Employer" name="employer" value={formData.employer} onChange={handleChange}>
                            <MenuItem value="">Select employer</MenuItem>
                            <MenuItem value="government">Government</MenuItem>
                            <MenuItem value="private">Private</MenuItem>
                            <MenuItem value="ngo">NGO</MenuItem>
                            <MenuItem value="self-employed">Self Employed</MenuItem>
                          </TextField>
                          <TextField label="Country" name="employmentCountry" value={formData.employmentCountry} onChange={handleChange} />
                          <TextField label="City" name="employmentCity" value={formData.employmentCity} onChange={handleChange} />
                          <TextField label="Address" name="employmentAddress" value={formData.employmentAddress} onChange={handleChange} />
                          <TextField label="Mobile Phone" name="employmentMobilePhone" value={formData.employmentMobilePhone} onChange={handleChange} />
                          <TextField
                            label="Email address"
                            name="employmentEmailAddress"
                            value={formData.employmentEmailAddress}
                            onChange={handleChange}
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Employment
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            label="Employment number"
                            name="employmentNumber"
                            value={formData.employmentNumber}
                            onChange={handleChange}
                          />
                          <TextField select label="Designation" name="designation" value={formData.designation} onChange={handleChange}>
                            <MenuItem value="">Select designation</MenuItem>
                            <MenuItem value="manager">Manager</MenuItem>
                            <MenuItem value="supervisor">Supervisor</MenuItem>
                            <MenuItem value="officer">Officer</MenuItem>
                            <MenuItem value="assistant">Assistant</MenuItem>
                          </TextField>
                          <TextField select label="Deparment" name="department" value={formData.department} onChange={handleChange}>
                            <MenuItem value="">Select department</MenuItem>
                            <MenuItem value="finance">Finance</MenuItem>
                            <MenuItem value="operations">Operations</MenuItem>
                            <MenuItem value="hr">Human Resource</MenuItem>
                            <MenuItem value="it">IT</MenuItem>
                          </TextField>
                          <TextField
                            label="Number of years with current employment"
                            name="yearsWithCurrentEmployment"
                            value={formData.yearsWithCurrentEmployment}
                            onChange={handleChange}
                          />
                          <TextField
                            label="Current salary"
                            name="currentSalary"
                            value={formData.currentSalary}
                            onChange={handleChange}
                            sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          References Details
                        </Typography>
                        <Button variant="outlined" size="small" onClick={handleAddReferenceCard}>
                          Add More References
                        </Button>
                      </Box>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                        <TextField
                          label="Name"
                          name="referenceDetailsName"
                          value={formData.referenceDetailsName}
                          onChange={handleChange}
                        />
                        <TextField
                          label="Address"
                          name="referenceDetailsAddress"
                          value={formData.referenceDetailsAddress}
                          onChange={handleChange}
                        />
                        <TextField
                          label="Mobile Phone"
                          name="referenceDetailsMobilePhone"
                          value={formData.referenceDetailsMobilePhone}
                          onChange={handleChange}
                        />
                        <TextField
                          label="Email Address"
                          name="referenceDetailsEmailAddress"
                          value={formData.referenceDetailsEmailAddress}
                          onChange={handleChange}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {additionalReferences.map((reference, index) => (
                    <Card key={reference.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                          References Details {index + 2}
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                          <TextField
                            label="Name"
                            value={reference.name}
                            onChange={(event) => handleAdditionalReferenceChange(reference.id, 'name', event.target.value)}
                          />
                          <TextField
                            label="Address"
                            value={reference.address}
                            onChange={(event) => handleAdditionalReferenceChange(reference.id, 'address', event.target.value)}
                          />
                          <TextField
                            label="Mobile Phone"
                            value={reference.mobilePhone}
                            onChange={(event) => handleAdditionalReferenceChange(reference.id, 'mobilePhone', event.target.value)}
                          />
                          <TextField
                            label="Email Address"
                            value={reference.emailAddress}
                            onChange={(event) => handleAdditionalReferenceChange(reference.id, 'emailAddress', event.target.value)}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {detailTab === 4 && (
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                        Biometric
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 1.25 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button component="label" variant="outlined" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
                            Select a photo
                            <input
                              hidden
                              accept="image/*"
                              type="file"
                              onChange={(event) => handleBiometricFileChange('biometricPhotoName', event)}
                            />
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            disabled={!formData.biometricPhotoName}
                            onClick={() => handleRemoveBiometricFile('biometricPhotoName')}
                            sx={{ textTransform: 'none' }}
                          >
                            Remove photo
                          </Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {formData.biometricPhotoName || 'No photo selected.'}
                        </Typography>
                        <Box
                          sx={{
                            mt: 0.5,
                            p: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 8px rgba(15, 23, 42, 0.06)',
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
                            Photo Preview
                          </Typography>
                          <Box
                            sx={{
                              border: '1px dashed',
                              borderColor: 'divider',
                              borderRadius: 1.5,
                              minHeight: 180,
                              display: 'grid',
                              placeItems: 'center',
                              overflow: 'hidden',
                              bgcolor: 'action.hover',
                            }}
                          >
                          {photoPreviewUrl ? (
                            <Box
                              component="img"
                              src={photoPreviewUrl}
                              alt="Selected photo preview"
                              sx={{ width: '100%', height: 180, objectFit: 'contain', objectPosition: 'center', borderRadius: 1, bgcolor: 'background.paper' }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Selected picture preview will appear here.
                            </Typography>
                          )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                        Signature
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 1.25 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button component="label" variant="outlined" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
                            Select a Signature
                            <input
                              hidden
                              accept="image/*"
                              type="file"
                              onChange={(event) => handleBiometricFileChange('biometricSignatureName', event)}
                            />
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            disabled={!formData.biometricSignatureName}
                            onClick={() => handleRemoveBiometricFile('biometricSignatureName')}
                            sx={{ textTransform: 'none' }}
                          >
                            Remove signature
                          </Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {formData.biometricSignatureName || 'No signature selected.'}
                        </Typography>
                        <Box
                          sx={{
                            mt: 0.5,
                            p: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 8px rgba(15, 23, 42, 0.06)',
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
                            Signature Preview
                          </Typography>
                          <Box
                            sx={{
                              border: '1px dashed',
                              borderColor: 'divider',
                              borderRadius: 1.5,
                              minHeight: 180,
                              display: 'grid',
                              placeItems: 'center',
                              overflow: 'hidden',
                              bgcolor: 'action.hover',
                            }}
                          >
                          {signaturePreviewUrl ? (
                            <Box
                              component="img"
                              src={signaturePreviewUrl}
                              alt="Selected signature preview"
                              sx={{ width: '100%', height: 180, objectFit: 'contain', bgcolor: 'background.paper', borderRadius: 1 }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Selected signature preview will appear here.
                            </Typography>
                          )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {detailTab !== 0 && detailTab !== 1 && detailTab !== 2 && detailTab !== 3 && detailTab !== 4 && (
                <Typography variant="body2" color="text.secondary">
                  This tab is ready.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outlined" onClick={handleGenerateReport} disabled={isGeneratingReport}>
              {isGeneratingReport ? 'Generating...' : 'Generate Report'}
            </Button>
          </Box>

          {reportData && (
            <Card sx={{ mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Customer Registration Report
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Generated At: {reportData.generatedAt || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Records: {reportData.totalRecords ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Latest Member: {reportData.latestMember?.fullName || '-'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Recently Registered Member DataGrid moved to bottom */}
      {recentMember && (
        <Card sx={{ mt: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Recently Registered Member
            </Typography>
            <div style={{ width: '100%' }}>
              <DataGrid
                rows={Array.isArray(recentMember) ? recentMember.map(r => formatRecentMemberRow(r, institutionBranches)) : [formatRecentMemberRow(recentMember, institutionBranches)]}
                columns={recentMemberColumns}
                getRowId={(row) => row.memberCode || row.id || row.clientCode || Math.random()}
                pageSizeOptions={[5, 10]}
                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                density="compact"
                autoHeight
              />
            </div>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

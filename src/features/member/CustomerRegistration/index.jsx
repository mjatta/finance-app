
import React, { useEffect, useRef, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
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
import { useAuthStore } from '../../../store/authStore';

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
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [institutionBranches, setInstitutionBranches] = useState([]);
  const [countries, setCountries] = useState([]);

  // Fetch institution branches for branch dropdowns
  useEffect(() => {
    const loadInstitutionBranches = async () => {
      try {
        // Use relative path so Vite proxy can intercept and handle CORS
        const url = '/api/remote-branches/branches';
        const response = await fetch(url);
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
        // Use relative path so Vite proxy can intercept and handle CORS
        const url = '/api/remote-countries/countries';
        const response = await fetch(url);
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
  const photoFileRef = useRef(null);
  const signatureFileRef = useRef(null);
  const [additionalReferences, setAdditionalReferences] = useState([]);
  const [additionalNextOfKins, setAdditionalNextOfKins] = useState([]);
  const [touched, setTouched] = useState({});

  const [formData, setFormData] = useState(initialForm);

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const isFieldInvalid = (fieldName) => {
    if (!touched[fieldName]) return false;
    const value = formData[fieldName];
    if (typeof value === 'string') return !value.trim();
    return !value;
  };

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
      photoFileRef.current = selectedFile;
      setPhotoPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return selectedFile ? URL.createObjectURL(selectedFile) : '';
      });
    }

    if (fieldName === 'biometricSignatureName') {
      signatureFileRef.current = selectedFile;
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
      photoFileRef.current = null;
      setPhotoPreviewUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return '';
      });
    }

    if (fieldName === 'biometricSignatureName') {
      signatureFileRef.current = null;
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

    // Validation with specific field names
    let missingFields = [];
    
    if (mainTab === 0) {
      // Individual validation
      if (!formData.firstName) missingFields.push('First Name');
      if (!formData.surname) missingFields.push('Surname');
      if (!formData.institutionBranch) missingFields.push('Branch');
      if (!formData.city) missingFields.push('City');
      if (!formData.address) missingFields.push('Address');
      if (!formData.region) missingFields.push('Region');
      if (!formData.district) missingFields.push('District');
      if (!formData.ward) missingFields.push('Ward');
    } else {
      // Institution validation
      if (!formData.institutionType) missingFields.push('Institution Type');
      if (!formData.institutionName) missingFields.push('Institution Name');
      if (!formData.institutionNature) missingFields.push('Business Category');
    }

    if (missingFields.length > 0) {
      // Only set touched for fields in the current tab
      if (mainTab === 0) {
        // Individual tab touched fields
        setTouched({
          firstName: !formData.firstName,
          surname: !formData.surname,
          institutionBranch: !formData.institutionBranch,
          city: !formData.city,
          address: !formData.address,
          region: !formData.region,
          district: !formData.district,
          ward: !formData.ward,
        });
      } else {
        // Institution tab touched fields
        setTouched({
          institutionType: !formData.institutionType,
          institutionName: !formData.institutionName,
          institutionNature: !formData.institutionNature,
        });
      }
      setStatusMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setStatusError(true);
      return;
    }

    // Validation (unchanged)

    // Convert uploaded images to base64
    const fileToBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const pictureBase64 = photoFileRef.current ? await fileToBase64(photoFileRef.current) : null;
    const signatureBase64 = signatureFileRef.current ? await fileToBase64(signatureFileRef.current) : null;

    if (mainTab === 0) {
      // Individual tab: map fields to backend payload and call useRegisterIndividual
      const individualPayload = buildIndividualPayload(formData, countries, cities, {
        compId: useAuthStore.getState().user?.CompId,
        branchId: useAuthStore.getState().user?.BranchId,
      });
      individualPayload.MemberPicture = pictureBase64;
      individualPayload.MemberSignature = signatureBase64;
      try {
        const result = await registerIndividual(individualPayload);
        setStatusMessage('Individual registration saved successfully.');
        notifySaveSuccess({
          page: 'Member Administration / Registration',
          action: 'Save Individual Registration',
          message: 'Individual registration saved successfully.',
          metadata: individualPayload,
        });

        // Set recent member data for printing
        if (result) {
          const memberData = formatRecentMemberRow(result, institutionBranches);
          setRecentMember({ ...result, ...memberData });
        }

        // Trigger print if checkbox is checked
        if (formData.printReceipt) {
          setTimeout(() => {
            handlePrintReceipt();
          }, 500);
        }

        setFormData(initialForm);
        setAdditionalReferences([]);
        setAdditionalNextOfKins([]);
        photoFileRef.current = null;
        signatureFileRef.current = null;
        setPhotoPreviewUrl('');
        setSignaturePreviewUrl('');
        setTouched({});
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
      institutionPayload = buildInstitutionPayload(formData, institutionBranches, cities, {
        compId: useAuthStore.getState().user?.CompId,
        branchId: useAuthStore.getState().user?.BranchId,
      });
      institutionPayload.MemberPicture = pictureBase64;
      institutionPayload.MemberSignature = signatureBase64;
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

        // Set recent member data for printing
        if (response) {
          const memberData = formatRecentMemberRow(response, institutionBranches);
          setRecentMember({ ...response, ...memberData });
        }

        // Trigger print if checkbox is checked
        if (formData.printReceipt) {
          setTimeout(() => {
            handlePrintReceipt();
          }, 500);
        }

        setFormData(initialForm);
        setAdditionalReferences([]);
        setAdditionalNextOfKins([]);
        photoFileRef.current = null;
        signatureFileRef.current = null;
        setPhotoPreviewUrl('');
        setSignaturePreviewUrl('');
        setTouched({});
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

  const handlePrintReceipt = () => {
    if (!recentMember) {
      setStatusMessage('Please save a registration before printing receipt.');
      setStatusError(true);
      return;
    }

    const printWindow = window.open('', '_blank', 'width=720,height=820');
    if (!printWindow) {
      setStatusMessage('Unable to open print window. Please allow pop-ups and try again.');
      setStatusError(true);
      return;
    }

    const now = new Date().toLocaleString();
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Registration Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
          .receipt-container { max-width: 600px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .header h2 { margin: 0; color: #333; }
          .header p { margin: 5px 0; font-size: 12px; color: #666; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; background-color: #f0f0f0; padding: 10px; margin-bottom: 10px; }
          .content-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .content-row span:first-child { font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 2px solid #333; font-size: 12px; color: #666; }
          .print-button { text-align: center; margin-top: 20px; }
          button { padding: 10px 30px; font-size: 16px; background-color: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background-color: #5568d3; }
          @media print { .print-button { display: none; } }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h2>Customer Registration Receipt</h2>
            <p>Date: ${now}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Registration Details</div>
            <div class="content-row">
              <span>Customer Code:</span>
              <span>${recentMember.memberCode || '-'}</span>
            </div>
            <div class="content-row">
              <span>Full Name:</span>
              <span>${recentMember.fullName || '-'}</span>
            </div>
            <div class="content-row">
              <span>Date Joined:</span>
              <span>${recentMember.dateJoined || '-'}</span>
            </div>
            <div class="content-row">
              <span>Date of Birth:</span>
              <span>${recentMember.dateOfBirth || '-'}</span>
            </div>
            <div class="content-row">
              <span>Branch:</span>
              <span>${recentMember.branch || '-'}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated receipt. Please keep for your records.</p>
            <p>Registration System © 2024</p>
          </div>
          
          <div class="print-button">
            <button onclick="window.print()">🖨️ Print</button>
            <button onclick="window.close()" style="margin-left: 10px; background-color: #999;">Close</button>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };



  return (
    <Box p={3} sx={{ position: 'relative' }}>
      <Backdrop
        open={isSaving}
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={96} thickness={5} />
          <Typography variant="h6" fontWeight={800}>Saving registration...</Typography>
        </Box>
      </Backdrop>

      <Typography variant="h4" gutterBottom>
        Registration Individual or Institution
      </Typography>

      {statusMessage && (
        <Alert
          severity={statusError ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => setStatusMessage('')}
        >
          {statusMessage}
        </Alert>
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
                      onBlur={() => handleBlur('firstName')}
                      error={isFieldInvalid('firstName')}
                      helperText={isFieldInvalid('firstName') ? 'First Name is required' : ''}
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
                      }}
                    />
                    <TextField label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
                    <TextField
                      required
                      label="Surname"
                      name="surname"
                      value={formData.surname}
                      onChange={handleChange}
                      onBlur={() => handleBlur('surname')}
                      error={isFieldInvalid('surname')}
                      helperText={isFieldInvalid('surname') ? 'Surname is required' : ''}
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
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
                      onBlur={() => handleBlur('institutionBranch')}
                      error={isFieldInvalid('institutionBranch')}
                      helperText={isFieldInvalid('institutionBranch') ? 'Branch is required' : ''}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (selected) => selected || 'Select branch',
                      }}
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
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
                      onBlur={() => handleBlur('institutionType')}
                      error={isFieldInvalid('institutionType')}
                      helperText={isFieldInvalid('institutionType') ? 'Institution Type is required' : ''}
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
                      }}
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
                      onBlur={() => handleBlur('institutionName')}
                      error={isFieldInvalid('institutionName')}
                      helperText={isFieldInvalid('institutionName') ? 'Institution Name is required' : ''}
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
                      }}
                    />
                    <TextField
                      select
                      required
                      label="Business Category"
                      name="institutionNature"
                      value={formData.institutionNature}
                      onChange={handleChange}
                      onBlur={() => handleBlur('institutionNature')}
                      error={isFieldInvalid('institutionNature')}
                      helperText={isFieldInvalid('institutionNature') ? 'Business Category is required' : ''}
                      sx={{
                        '& .MuiFormLabel-root.Mui-required::after': {
                          color: '#fff',
                          fontWeight: 'bold',
                        },
                      }}
                    >
                      <MenuItem value="">Select business category</MenuItem>
                      <MenuItem value={1}>Business</MenuItem>
                      <MenuItem value={2}>Association</MenuItem>
                      <MenuItem value={3}>NGO</MenuItem>
                      <MenuItem value={4}>Cooperative</MenuItem>
                    </TextField>
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
                            onBlur={() => handleBlur('city')}
                            error={isFieldInvalid('city') || Boolean(fieldErrors.city)}
                            helperText={isFieldInvalid('city') ? 'City is required' : ''}
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
                            error={Boolean(fieldErrors.address) || (touched.address && !formData.address)}
                            helperText={touched.address && !formData.address ? 'Address is required' : ''}
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
                            select
                            required
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            onBlur={() => handleBlur('title')}
                            error={isFieldInvalid('title')}
                            helperText={isFieldInvalid('title') ? 'Title is required' : ''}
                          >
                            {[
                              { tit_name: 'MR.', tit_id: 1 },
                              { tit_name: 'MRS', tit_id: 2 },
                              { tit_name: 'MS', tit_id: 3 },
                              { tit_name: 'ALHAJ', tit_id: 4 },
                              { tit_name: 'PROF.', tit_id: 5 },
                              { tit_name: 'DR.', tit_id: 6 },
                              { tit_name: 'Sister', tit_id: 7 },
                            ].map((t) => (
                              <MenuItem key={t.tit_id} value={t.tit_id}>
                                {t.tit_name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            required
                            label="Gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            onBlur={() => handleBlur('gender')}
                            error={isFieldInvalid('gender')}
                            helperText={isFieldInvalid('gender') ? 'Gender is required' : ''}
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
                              onBlur={() => handleBlur('nationality')}
                              error={isFieldInvalid('nationality')}
                              helperText={isFieldInvalid('nationality') ? 'Nationality is required' : ''}
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
                            onBlur={() => handleBlur('maritalStatus')}
                            error={isFieldInvalid('maritalStatus')}
                            helperText={isFieldInvalid('maritalStatus') ? 'Marital status is required' : ''}
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
                            onBlur={() => handleBlur('idType')}
                            error={isFieldInvalid('idType')}
                            helperText={isFieldInvalid('idType') ? 'ID Type is required' : ''}
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
                            onBlur={() => handleBlur('idNumber')}
                            error={isFieldInvalid('idNumber')}
                            helperText={isFieldInvalid('idNumber') ? 'ID number is required' : ''}
                          />
                          <TextField
                            required
                            label="Place Issued"
                            name="placeIssue"
                            value={formData.placeIssue}
                            onChange={handleChange}
                            onBlur={() => handleBlur('placeIssue')}
                            error={isFieldInvalid('placeIssue')}
                            helperText={isFieldInvalid('placeIssue') ? 'Place Issued is required' : ''}
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
                            required
                            error={touched.region && !formData.region}
                            helperText={touched.region && !formData.region ? 'Region is required' : ''}
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
                            required
                            error={touched.district && !formData.district}
                            helperText={touched.district && !formData.district ? 'District is required' : ''}
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
                            required
                            error={touched.ward && !formData.ward}
                            helperText={touched.ward && !formData.ward ? 'Ward is required' : ''}
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
                          onBlur={() => handleBlur('signatory1')}
                          error={isFieldInvalid('signatory1')}
                          helperText={isFieldInvalid('signatory1') ? 'Signatory 1 is required' : ''}
                        />
                        <TextField
                          label="Signatory 2"
                          name="signatory2"
                          value={formData.signatory2}
                          onChange={handleChange}
                        />
                      </Box>
                    </CardContent>
                  </Card>
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
                                  onBlur={() => handleBlur('country')}
                                  error={isFieldInvalid('country')}
                                  helperText={isFieldInvalid('country') ? 'Country of Residence is required' : ''}
                                >
                                  <MenuItem value="">Select country</MenuItem>
                                  {countries.map((country) => (
                                    <MenuItem key={country.id} value={country.id}>{country.name}</MenuItem>
                                  ))}
                                </TextField>
                        <TextField
                          select
                          required
                          label="City"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          onBlur={() => handleBlur('city')}
                          error={isFieldInvalid('city')}
                          helperText={isFieldInvalid('city') ? 'City is required' : ''}
                        >
                          <MenuItem value="">Select city</MenuItem>
                          {cities.map((city) => (
                            <MenuItem key={`city-${city.id}-${city.name}`} value={city.name}>{city.name}</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          required
                          label="Address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          error={touched.address && !formData.address}
                          helperText={touched.address && !formData.address ? 'Address is required' : ''}
                        />
                        <TextField
                          required
                          label="Mobile Phone number"
                          name="mobilePhoneNumber"
                          value={formData.mobilePhoneNumber}
                          onChange={handleChange}
                          onBlur={() => handleBlur('mobilePhoneNumber')}
                          error={isFieldInvalid('mobilePhoneNumber')}
                          helperText={isFieldInvalid('mobilePhoneNumber') ? 'Mobile Phone number is required' : ''}
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
                          onBlur={() => handleBlur('nextOfKinName')}
                          error={isFieldInvalid('nextOfKinName')}
                          helperText={isFieldInvalid('nextOfKinName') ? 'Name is required' : ''}
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
                            onBlur={() => handleBlur('registrationFee')}
                            error={isFieldInvalid('registrationFee')}
                            helperText={isFieldInvalid('registrationFee') ? 'Registration Fee is required' : ''}
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

                    {mainTab === 0 && (
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
                            onBlur={() => handleBlur('signatory1')}
                            error={isFieldInvalid('signatory1')}
                            helperText={isFieldInvalid('signatory1') ? 'Signatory 1 is required' : ''}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                    )}
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

          <Box sx={{ mt: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <FormControlLabel
              control={<Checkbox name="printReceipt" checked={formData.printReceipt} onChange={handleChange} />}
              label="Print receipt after saving"
              sx={{ '& .MuiTypography-root': { fontSize: '0.95rem' }, pt: 1 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isSaving}
              sx={{
                backgroundColor: '#667eea',
                '&:hover': { backgroundColor: '#5568d3' },
                fontWeight: 600,
                paddingX: 3,
                boxShadow: 'none',
                textTransform: 'none',
              }}
            >
              {isSaving ? 'Saving...' : '💾 Save'}
            </Button>
            <Button variant="outlined" onClick={handlePrintReceipt}>
              🖨️ Print Receipt
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

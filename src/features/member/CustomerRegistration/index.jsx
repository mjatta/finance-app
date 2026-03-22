import React, { useEffect, useState } from 'react';
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
import { DataGrid } from '@mui/x-data-grid';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

export default function CustomerRegistration({ user }) {
  const [mainTab, setMainTab] = useState(0);
  const [detailTab, setDetailTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [reportData, setReportData] = useState(null);

  const [institutionBranches, setInstitutionBranches] = useState([]);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState('');
  const [references, setReferences] = useState([]);
  const [formData, setFormData] = useState({
    institutionType: 'corporate',
    institutionName: '',
    institutionNature: '',
    institutionMemberCode: '',
    institutionCreditUnion: '',
    institutionBranch: '',
    institutionIncoporationNumber: '',
    institutionTIN: '',
    institutionIncoporationDate: '',
    institutionDateJoined: '',
    institutionRegion: '',
    institutionDistrict: '',
    institutionWard: '',
    institutionResidency: 'resident',
    institutionMembershipType: 'conventional-member',
    firstName: '',
    middleName: '',
    surname: '',
    memberCode: '',
    creditUnion: '',
    branch: '',
    memberEmployed: false,
    sendSms: false,
    registerMobileWallet: false,
    title: '',
    nationality: '',
    tribe: '',
    levelOfEducation: '',
    dateOfBirth: '',
    dateJoined: '',
    payChildrenEducation: false,
    provideFoodForFamily: false,
    dependance: false,
    gender: '',
    maritalStatus: '',
    idType: '',
    idNumber: '',
    placeIssue: '',
    dateIssued: '',
    expiryDate: '',
    povertyLevel: '',
    region: '',
    district: '',
    ward: '',
    country: '',
    city: '',
    address: '',
    mobilePhoneNumber: '',
    emailAddress: '',
    refereeName: '',
    refereeAddress: '',
    refereeMobilePhone: '',
    refereeEmailAddress: '',
    nextOfKinName: '',
    nextOfKinAddress: '',
    nextOfKinRelationship: '',
    nextOfKinMobilePhone: '',
    employer: '',
    employmentCountry: '',
    employmentCity: '',
    employmentAddress: '',
    employmentMobilePhone: '',
    employmentEmailAddress: '',
    employmentNumber: '',
    designation: '',
    department: '',
    yearsWithCurrentEmployment: '',
    currentSalary: '',
    biometricPhotoName: '',
    biometricSignatureName: '',
    registrationFee: '',
    contributionAccountNumber: '',
    contributionAccountName: '',
    sharePrice: '',
    sharesPurchase: '',
    shareValue: '',
    savingMode: 'fixed',
    savingAmount: '',
    accountSignatory: '',
    deductedFromSourcePayroll: false,
    residency: 'resident',
    membershipType: 'conventional-member',
    // Institution board members
    chairName: '',
    chairTIN: '',
    chairMobilePhone: '',
    chairEmailAddress: '',
    chairAccountSignatory: false,
    viceChairName: '',
    viceChairTIN: '',
    viceChairMobilePhone: '',
    viceChairEmailAddress: '',
    viceChairAccountSignatory: false,
    treasurerName: '',
    treasurerTIN: '',
    treasurerMobilePhone: '',
    treasurerEmailAddress: '',
    treasurerAccountSignatory: false,
    secretaryName: '',
    secretaryTIN: '',
    secretaryMobilePhone: '',
    secretaryEmailAddress: '',
    secretaryAccountSignatory: false,
    // Reference details form fields
    referenceDetailsName: '',
    referenceDetailsAddress: '',
    referenceDetailsMobilePhone: '',
    referenceDetailsEmailAddress: '',
    // Account Signatories fields
    signatory1: '',
    signatory2: '',
    signatory3: '',
    defaultBatch: '',
  });

  const isReadOnlyRole = Boolean(user?.access?.readOnly);



  useEffect(() => {
    const loadInstitutionBranches = async () => {
      try {
        const response = await fetch('/api/remote-branches/branches');
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const branchOptions = Array.from(
          new Set(
            (Array.isArray(payload) ? payload : [])
              .map((item) => (item?.br_name || item?.branchName || item?.name || '').toString().trim())
              .filter(Boolean),
          ),
        );

        setInstitutionBranches(branchOptions);
      } catch {
        setInstitutionBranches([]);
      }
    };

    loadInstitutionBranches();
  }, []);

  useEffect(() => () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    if (signaturePreviewUrl) {
      URL.revokeObjectURL(signaturePreviewUrl);
    }
  }, [photoPreviewUrl, signaturePreviewUrl]);



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

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setStatusMessage('');
    setStatusError(false);
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

  const handleAddReference = () => {
    const { referenceDetailsName, referenceDetailsAddress, referenceDetailsMobilePhone, referenceDetailsEmailAddress } = formData;

    if (!referenceDetailsName.trim() || !referenceDetailsAddress.trim() || !referenceDetailsMobilePhone.trim() || !referenceDetailsEmailAddress.trim()) {
      setStatusMessage('Please fill all reference details fields.');
      setStatusError(true);
      return;
    }

    const newReference = {
      id: Date.now(),
      name: referenceDetailsName,
      address: referenceDetailsAddress,
      mobilePhone: referenceDetailsMobilePhone,
      emailAddress: referenceDetailsEmailAddress,
    };

    setReferences((prev) => [...prev, newReference]);
    
    setFormData((prev) => ({
      ...prev,
      referenceDetailsName: '',
      referenceDetailsAddress: '',
      referenceDetailsMobilePhone: '',
      referenceDetailsEmailAddress: '',
    }));

    setStatusMessage('Reference added successfully.');
    setStatusError(false);
  };

  const handleRemoveReference = (id) => {
    setReferences((prev) => prev.filter((ref) => ref.id !== id));
  };

  const handleSave = async () => {
    if (isReadOnlyRole || isSaving) {
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      const payload = {
        ...formData,
        createdAt: new Date().toISOString(),
      };

      const response = await fetch('/api/customer-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ row: payload }),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      setStatusMessage('Customer registration saved successfully.');
      notifySaveSuccess({
        page: 'Member Administration / Registration',
        action: 'Save Customer Registration',
        message: 'Customer registration saved successfully.',
      });
    } catch (error) {
      setStatusMessage('Unable to save customer registration.');
      setStatusError(true);
      notifySaveError({
        page: 'Member Administration / Registration',
        action: 'Save Customer Registration',
        message: 'Unable to save customer registration.',
        error,
      });
    } finally {
      setIsSaving(false);
    }
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
        Customer Registration / Individual / Listing
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
          sx={{ border: 'none', p: 0, m: 0, opacity: isReadOnlyRole ? 0.55 : 1, pointerEvents: isReadOnlyRole ? 'none' : 'auto' }}
        >
          <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              {mainTab === 0 ? (
                <>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
                    <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                    <TextField label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
                    <TextField label="Surname" name="surname" value={formData.surname} onChange={handleChange} />
                    <TextField label="Member Code" name="memberCode" value={formData.memberCode} onChange={handleChange} />
                    <TextField label="Credit Union" name="creditUnion" value={formData.creditUnion} onChange={handleChange} />
                    <TextField label="Branch" name="branch" value={formData.branch} onChange={handleChange} />
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
                  <FormControl>
                    <FormLabel>Institution Type</FormLabel>
                    <RadioGroup row name="institutionType" value={formData.institutionType} onChange={handleChange}>
                      <FormControlLabel value="corporate" control={<Radio />} label="Corporate" />
                      <FormControlLabel value="group" control={<Radio />} label="Group" />
                    </RadioGroup>
                  </FormControl>

                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
                    <TextField label="Name" name="institutionName" value={formData.institutionName} onChange={handleChange} />
                    <TextField select label="Nature" name="institutionNature" value={formData.institutionNature} onChange={handleChange}>
                      <MenuItem value="">Select nature</MenuItem>
                      <MenuItem value="business">Business</MenuItem>
                      <MenuItem value="association">Association</MenuItem>
                      <MenuItem value="ngo">NGO</MenuItem>
                      <MenuItem value="cooperative">Cooperative</MenuItem>
                    </TextField>
                    <TextField label="Member Code" name="institutionMemberCode" value={formData.institutionMemberCode} onChange={handleChange} />
                    <TextField label="Credit Union" name="institutionCreditUnion" value={formData.institutionCreditUnion} onChange={handleChange} />
                    <TextField select label="Branch" name="institutionBranch" value={formData.institutionBranch} onChange={handleChange}>
                      <MenuItem value="">Select branch</MenuItem>
                      {institutionBranches.map((item) => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </TextField>
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
                          <TextField select label="Country" name="country" value={formData.country} onChange={handleChange}>
                            <MenuItem value="">Select country</MenuItem>
                            <MenuItem value="gambia">Gambia</MenuItem>
                            <MenuItem value="senegal">Senegal</MenuItem>
                            <MenuItem value="guinea">Guinea</MenuItem>
                            <MenuItem value="sierra-leone">Sierra Leone</MenuItem>
                          </TextField>
                          <TextField select label="City" name="city" value={formData.city} onChange={handleChange}>
                            <MenuItem value="">Select city</MenuItem>
                            <MenuItem value="banjul">Banjul</MenuItem>
                            <MenuItem value="serrekunda">Serrekunda</MenuItem>
                            <MenuItem value="brikama">Brikama</MenuItem>
                            <MenuItem value="bakau">Bakau</MenuItem>
                          </TextField>
                          <TextField label="Address" name="address" value={formData.address} onChange={handleChange} />
                          <TextField label="Mobile Phone number" name="mobilePhoneNumber" value={formData.mobilePhoneNumber} onChange={handleChange} />
                          <TextField
                            label="Email address"
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

                          <FormControl sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                            <FormLabel>Member Type</FormLabel>
                            <RadioGroup row name="institutionMembershipType" value={formData.institutionMembershipType} onChange={handleChange}>
                              <FormControlLabel value="conventional-member" control={<Radio />} label="Conventional Member" />
                              <FormControlLabel value="sharia-member" control={<Radio />} label="Sharia Member" />
                              <FormControlLabel value="both" control={<Radio />} label="Both" />
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
                            label="Incoporation Number"
                            name="institutionIncoporationNumber"
                            value={formData.institutionIncoporationNumber}
                            onChange={handleChange}
                          />
                          <TextField
                            label="TIN"
                            name="institutionTIN"
                            value={formData.institutionTIN}
                            onChange={handleChange}
                          />
                          <TextField
                            label="Incoporation date"
                            type="date"
                            name="institutionIncoporationDate"
                            value={formData.institutionIncoporationDate}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                          />
                          <TextField
                            label="Date joined"
                            type="date"
                            name="institutionDateJoined"
                            value={formData.institutionDateJoined}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                          />
                          <TextField
                            select
                            label="Region"
                            name="institutionRegion"
                            value={formData.institutionRegion}
                            onChange={handleChange}
                          >
                            <MenuItem value="">Select region</MenuItem>
                            <MenuItem value="banjul">Banjul</MenuItem>
                            <MenuItem value="kanifing">Kanifing</MenuItem>
                            <MenuItem value="west-coast">West Coast</MenuItem>
                            <MenuItem value="north-bank">North Bank</MenuItem>
                            <MenuItem value="lower-river">Lower River</MenuItem>
                            <MenuItem value="central-river">Central River</MenuItem>
                            <MenuItem value="upper-river">Upper River</MenuItem>
                          </TextField>
                          <TextField
                            select
                            label="District"
                            name="institutionDistrict"
                            value={formData.institutionDistrict}
                            onChange={handleChange}
                          >
                            <MenuItem value="">Select district</MenuItem>
                            <MenuItem value="banjul">Banjul</MenuItem>
                            <MenuItem value="kanifing">Kanifing</MenuItem>
                            <MenuItem value="kombo-north">Kombo North</MenuItem>
                            <MenuItem value="kombo-south">Kombo South</MenuItem>
                          </TextField>
                          <TextField
                            select
                            label="Ward"
                            name="institutionWard"
                            value={formData.institutionWard}
                            onChange={handleChange}
                          >
                            <MenuItem value="">Select ward</MenuItem>
                            <MenuItem value="ward-1">Ward 1</MenuItem>
                            <MenuItem value="ward-2">Ward 2</MenuItem>
                            <MenuItem value="ward-3">Ward 3</MenuItem>
                            <MenuItem value="ward-4">Ward 4</MenuItem>
                          </TextField>

                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
                      <TextField label="Title" name="title" value={formData.title} onChange={handleChange} />
                      <TextField label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                      <TextField label="Tribe" name="tribe" value={formData.tribe} onChange={handleChange} />
                      <TextField label="Level of Education" name="levelOfEducation" value={formData.levelOfEducation} onChange={handleChange} />
                      <TextField
                        label="Date of Birth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="Date Joined"
                        name="dateJoined"
                        type="date"
                        value={formData.dateJoined}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <FormControlLabel
                        control={<Checkbox name="payChildrenEducation" checked={formData.payChildrenEducation} onChange={handleChange} />}
                        label="Ablity to pay for children education"
                      />
                      <FormControlLabel
                        control={<Checkbox name="provideFoodForFamily" checked={formData.provideFoodForFamily} onChange={handleChange} />}
                        label="Ablity to provide food for the family"
                      />
                      <FormControlLabel
                        control={<Checkbox name="dependance" checked={formData.dependance} onChange={handleChange} />}
                        label="Dependance"
                      />
                    </Box>

                    <Box sx={{ mt: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
                      <TextField select label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </TextField>
                      <TextField select label="Marital status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}>
                        <MenuItem value="single">Single</MenuItem>
                        <MenuItem value="married">Married</MenuItem>
                        <MenuItem value="divorced">Divorced</MenuItem>
                        <MenuItem value="widowed">Widowed</MenuItem>
                      </TextField>
                      <TextField select label="ID Type" name="idType" value={formData.idType} onChange={handleChange}>
                        <MenuItem value="national-id">National ID</MenuItem>
                        <MenuItem value="passport">Passport</MenuItem>
                        <MenuItem value="driver-license">Driver License</MenuItem>
                      </TextField>
                      <TextField label="ID number" name="idNumber" value={formData.idNumber} onChange={handleChange} />
                      <TextField label="Place Issue" name="placeIssue" value={formData.placeIssue} onChange={handleChange} />
                      <TextField
                        label="Date Issued"
                        name="dateIssued"
                        type="date"
                        value={formData.dateIssued}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="Expiry Date"
                        name="expiryDate"
                        type="date"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField select label="Select Poverty level" name="povertyLevel" value={formData.povertyLevel} onChange={handleChange}>
                        <MenuItem value="extreme">Extreme</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                      </TextField>
                      <TextField label="Region" name="region" value={formData.region} onChange={handleChange} />
                      <TextField label="Distric" name="district" value={formData.district} onChange={handleChange} />
                      <TextField label="Ward" name="ward" value={formData.ward} onChange={handleChange} />
                    </Box>

                    <Box sx={{ mt: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                      <FormControl>
                        <FormLabel>Resident Type</FormLabel>
                        <RadioGroup row name="residency" value={formData.residency} onChange={handleChange}>
                          <FormControlLabel value="resident" control={<Radio />} label="Resident" />
                          <FormControlLabel value="non-resident" control={<Radio />} label="Non Resident" />
                        </RadioGroup>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Member Type</FormLabel>
                        <RadioGroup row name="membershipType" value={formData.membershipType} onChange={handleChange}>
                          <FormControlLabel value="conventional-member" control={<Radio />} label="Conventional Member" />
                          <FormControlLabel value="sharia-member" control={<Radio />} label="Sharia Member" />
                          <FormControlLabel value="both" control={<Radio />} label="Both" />
                        </RadioGroup>
                      </FormControl>
                    </Box>
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
                          <TextField label="Name" name="chairName" value={formData.chairName} onChange={handleChange} sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }} />
                          <TextField label="TIN" name="chairTIN" value={formData.chairTIN} onChange={handleChange} />
                          <TextField label="Mobile Phone" name="chairMobilePhone" value={formData.chairMobilePhone} onChange={handleChange} />
                          <TextField label="Email Address" name="chairEmailAddress" value={formData.chairEmailAddress} onChange={handleChange} />
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
                          <TextField label="Name" name="treasurerName" value={formData.treasurerName} onChange={handleChange} sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }} />
                          <TextField label="TIN" name="treasurerTIN" value={formData.treasurerTIN} onChange={handleChange} />
                          <TextField label="Mobile Phone" name="treasurerMobilePhone" value={formData.treasurerMobilePhone} onChange={handleChange} />
                          <TextField label="Email Address" name="treasurerEmailAddress" value={formData.treasurerEmailAddress} onChange={handleChange} />
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
                        <TextField select label="Country" name="country" value={formData.country} onChange={handleChange}>
                          <MenuItem value="">Select country</MenuItem>
                          <MenuItem value="gambia">Gambia</MenuItem>
                          <MenuItem value="senegal">Senegal</MenuItem>
                          <MenuItem value="guinea">Guinea</MenuItem>
                          <MenuItem value="sierra-leone">Sierra Leone</MenuItem>
                        </TextField>
                        <TextField select label="City" name="city" value={formData.city} onChange={handleChange}>
                          <MenuItem value="">Select city</MenuItem>
                          <MenuItem value="banjul">Banjul</MenuItem>
                          <MenuItem value="serrekunda">Serrekunda</MenuItem>
                          <MenuItem value="brikama">Brikama</MenuItem>
                          <MenuItem value="bakau">Bakau</MenuItem>
                        </TextField>
                        <TextField label="Address" name="address" value={formData.address} onChange={handleChange} />
                        <TextField label="Mobile Phone number" name="mobilePhoneNumber" value={formData.mobilePhoneNumber} onChange={handleChange} />
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
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                        Next of kin Details
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                        <TextField label="Name" name="nextOfKinName" value={formData.nextOfKinName} onChange={handleChange} />
                        <TextField label="Address" name="nextOfKinAddress" value={formData.nextOfKinAddress} onChange={handleChange} />
                        <TextField label="Relationship" name="nextOfKinRelationship" value={formData.nextOfKinRelationship} onChange={handleChange} />
                        <TextField label="Mobile Phone" name="nextOfKinMobilePhone" value={formData.nextOfKinMobilePhone} onChange={handleChange} />
                      </Box>
                    </CardContent>
                  </Card>
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
                          />
                          <TextField
                            label="Share Purchased"
                            name="sharesPurchase"
                            value={formData.sharesPurchase}
                            onChange={handleChange}
                          />
                          <TextField
                            label="Share Value"
                            name="shareValue"
                            value={formData.shareValue}
                            onChange={handleChange}
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
                            label="Signatory 1"
                            name="signatory1"
                            value={formData.signatory1}
                            onChange={handleChange}
                          />
                          <TextField
                            label="Signatory 2"
                            name="signatory2"
                            value={formData.signatory2}
                            onChange={handleChange}
                          />
                          <TextField
                            label="Signatory 3"
                            name="signatory3"
                            value={formData.signatory3}
                            onChange={handleChange}
                          />
                          <TextField
                            label="Default Batch"
                            name="defaultBatch"
                            value={formData.defaultBatch}
                            onChange={handleChange}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>

                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                        Product DataGrid
                      </Typography>
                      <div style={{ height: 200, width: '100%' }}>
                        <DataGrid
                          rows={[]}
                          columns={[
                            { field: 'productName', headerName: 'Product Name', flex: 1, minWidth: 140 },
                            { field: 'accountNumber', headerName: 'Account Number', flex: 1, minWidth: 140 },
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
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                        References Details
                      </Typography>
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
                      <Button
                        variant="contained"
                        onClick={handleAddReference}
                        sx={{ mt: 2 }}
                      >
                        Add Reference
                      </Button>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                        References List
                      </Typography>
                      {references.length === 0 ? (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No references added yet.
                        </Typography>
                      ) : (
                        <div style={{ height: 400, width: '100%' }}>
                          <DataGrid
                            rows={references.map((ref) => ({
                              ...ref,
                              id: ref.id || `ref-${Date.now()}`,
                            }))}
                            columns={[
                              { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
                              { field: 'address', headerName: 'Address', flex: 1, minWidth: 120 },
                              { field: 'mobilePhone', headerName: 'Mobile Phone', flex: 1, minWidth: 120 },
                              { field: 'emailAddress', headerName: 'Email Address', flex: 1, minWidth: 150 },
                              {
                                field: 'action',
                                headerName: 'Action',
                                flex: 0.8,
                                minWidth: 100,
                                sortable: false,
                                renderCell: (params) => (
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => handleRemoveReference(params.row.id)}
                                  >
                                    Remove
                                  </Button>
                                ),
                              },
                            ]}
                            pageSizeOptions={[10, 25, 50]}
                            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                            density="compact"
                            sx={{
                              '& .MuiDataGrid-columnHeader': {
                                backgroundColor: 'primary.main',
                                color: 'primary.contrastText',
                                fontWeight: 700,
                              },
                              '& .MuiDataGrid-row:nth-of-type(even)': {
                                backgroundColor: '#f8f9fa',
                              },
                              '& .MuiDataGrid-row:hover': {
                                backgroundColor: '#e9ecef',
                              },
                              '& .MuiDataGrid-cell': {
                                borderColor: '#dee2e6',
                              },
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
    </Box>
  );
}

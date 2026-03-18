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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

export default function CustomerRegistration({ user }) {
  const [mainTab, setMainTab] = useState(0);
  const [detailTab, setDetailTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [listingRows, setListingRows] = useState([]);
  const [isLoadingListing, setIsLoadingListing] = useState(false);
  const [listingSearch, setListingSearch] = useState('');
  const [formData, setFormData] = useState({
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
    residency: 'resident',
    membershipType: 'conventional-member',
  });

  const isReadOnlyRole = Boolean(user?.access?.readOnly);

  const loadListingRows = async () => {
    setIsLoadingListing(true);
    try {
      const response = await fetch('/api/customer-registration');
      if (!response.ok) {
        throw new Error('Unable to load listing');
      }
      const payload = await response.json();
      setListingRows(Array.isArray(payload?.rows) ? payload.rows : []);
    } catch {
      setListingRows([]);
    } finally {
      setIsLoadingListing(false);
    }
  };

  useEffect(() => {
    if (mainTab === 2) {
      loadListingRows();
    }
  }, [mainTab]);

  const normalizedListingSearch = listingSearch.trim().toLowerCase();
  const filteredListingRows = normalizedListingSearch
    ? listingRows.filter((row) => {
        const firstName = String(row?.firstName || '').toLowerCase();
        const middleName = String(row?.middleName || '').toLowerCase();
        const surname = String(row?.surname || '').toLowerCase();
        const memberCode = String(row?.memberCode || '').toLowerCase();

        return (
          firstName.includes(normalizedListingSearch)
          || middleName.includes(normalizedListingSearch)
          || surname.includes(normalizedListingSearch)
          || memberCode.includes(normalizedListingSearch)
        );
      })
    : listingRows;

  const tabGroupSx = {
    minHeight: 44,
    mb: 2,
    p: 0.5,
    borderRadius: 2,
    bgcolor: 'action.hover',
    '& .MuiTabs-indicator': {
      display: 'none',
    },
    '& .MuiTab-root': {
      minHeight: 36,
      textTransform: 'none',
      borderRadius: 1.5,
      fontWeight: 600,
      color: 'text.secondary',
      px: 2,
      transition: 'all 0.2s ease',
    },
    '& .MuiTab-root:hover': {
      color: 'text.primary',
      bgcolor: 'action.selected',
    },
    '& .Mui-selected': {
      color: 'primary.main !important',
      bgcolor: 'background.paper',
      boxShadow: '0 1px 2px rgba(16, 42, 67, 0.08)',
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
      await loadListingRows();
    } catch {
      setStatusMessage('Unable to save customer registration.');
      setStatusError(true);
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
        allowScrollButtonsMobile
        sx={tabGroupSx}
      >
        <Tab label="Individual" />
        <Tab label="Institution" />
        <Tab label="Listing" />
      </Tabs>

      {mainTab === 1 && (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary">
              Institution tab is ready.
            </Typography>
          </CardContent>
        </Card>
      )}

      {mainTab === 2 && (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
              Member Listing
            </Typography>
            <Box sx={{ mb: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                label="Search by Member Code or Name"
                value={listingSearch}
                onChange={(event) => setListingSearch(event.target.value)}
                sx={{ width: { xs: '100%', md: 420 } }}
              />
              <Button
                variant="outlined"
                onClick={() => setListingSearch('')}
                disabled={!listingSearch}
              >
                Clear
              </Button>
            </Box>
            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>First Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Middle Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Surname</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Member Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Credit Union</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingListing ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredListingRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                        No records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredListingRows.map((row, index) => (
                      <TableRow key={`${row.memberCode || 'member'}-${index}`} hover>
                        <TableCell>{row.firstName || '-'}</TableCell>
                        <TableCell>{row.middleName || '-'}</TableCell>
                        <TableCell>{row.surname || '-'}</TableCell>
                        <TableCell>{row.memberCode || '-'}</TableCell>
                        <TableCell>{row.creditUnion || '-'}</TableCell>
                        <TableCell>{row.branch || '-'}</TableCell>
                        <TableCell>{row.dateJoined || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {mainTab === 0 && (
        <Box
          component="fieldset"
          disabled={isReadOnlyRole}
          sx={{ border: 'none', p: 0, m: 0, opacity: isReadOnlyRole ? 0.55 : 1, pointerEvents: isReadOnlyRole ? 'none' : 'auto' }}
        >
          <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Tabs
                value={detailTab}
                onChange={(_, nextTab) => setDetailTab(nextTab)}
                variant="scrollable"
                allowScrollButtonsMobile
                sx={tabGroupSx}
              >
                <Tab label="Basic Details" />
                <Tab label="Contact Details" />
                <Tab label="Employment Detail" />
                <Tab label="Contribution" />
                <Tab label="Biometri" />
              </Tabs>

              {detailTab === 0 && (
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
              )}

              {detailTab !== 0 && (
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

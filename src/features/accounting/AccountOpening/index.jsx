import React, { useState } from 'react';
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import { useAccountBranches } from './hooks/useAccountBranches';
import { useAccountSubgroups } from './hooks/useAccountSubgroups';
import { useNextAccount } from './hooks/useNextAccount';
import { useCreateAccount } from './hooks/useCreateAccount';
import { useAuthStore } from '../../../store/authStore';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

export default function AccountOpening() {
  const { branches, loading: branchesLoading } = useAccountBranches();
  const { subgroups, loading: subgroupsLoading } = useAccountSubgroups();
  const { fetchNextAccount } = useNextAccount();
  const { loading: isSaving, createAccount } = useCreateAccount();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    subHead: '',
    branch: '',
    itemNumber: '',
    accountNumber: '',
    accountName: '',
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubHeadChange = async (e) => {
    const subgrpcode = e.target.value;
    setFormData((prev) => ({
      ...prev,
      subHead: subgrpcode,
    }));

    if (subgrpcode) {
      const nextAccount = await fetchNextAccount(subgrpcode);
      if (nextAccount) {
        setFormData((prev) => ({
          ...prev,
          subHead: subgrpcode,
          itemNumber: nextAccount.AccountItem || '',
          accountNumber: nextAccount.AccountNumber || '',
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation - convert to strings for trim() since branch is numeric
    if (!String(formData.subHead).trim() || !String(formData.branch).trim() ||
        !String(formData.itemNumber).trim() || !String(formData.accountNumber).trim() || !String(formData.accountName).trim()) {
      setStatusMessage('Please fill in all fields');
      setStatusError(true);
      return;
    }

    const payload = {
      AccountNumber: formData.accountNumber,
      AccountName: formData.accountName,
      BranchId: Number(formData.branch),
      AccountItem: formData.itemNumber,
      UserId: user?.username || 'SYSTEM',
      CurrencyCode: 1,
      SubGroupCode: formData.subHead,
      CompanyId: user?.CompId || 30,
    };

    try {
      await createAccount(payload);
      setStatusMessage('Account opening data submitted successfully');
      setStatusError(false);
      notifySaveSuccess({
        page: 'Accounting / Account Opening',
        action: 'Create Account',
        message: `Account ${formData.accountNumber} created successfully`,
      });
      handleClear();
    } catch (err) {
      setStatusMessage(err.message || 'Failed to submit account opening data');
      setStatusError(true);
      notifySaveError({
        page: 'Accounting / Account Opening',
        action: 'Create Account',
        message: 'Failed to create account',
        error: err,
      });
    }
  };

  const handleClear = () => {
    setFormData({
      subHead: '',
      branch: '',
      itemNumber: '',
      accountNumber: '',
      accountName: '',
    });
    setStatusMessage('');
    setStatusError(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 0.5, fontSize: '1.2rem' }}>
            Account Opening
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Create new account opening records
          </Typography>
        </CardContent>
      </Card>

      {/* Status Message */}
      {statusMessage && (
        <Alert
          severity={statusError ? 'error' : 'success'}
          onClose={() => setStatusMessage('')}
          sx={{ mb: 2 }}
        >
          {statusMessage}
        </Alert>
      )}

      {/* Form Card */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.5, pb: 1.5, fontSize: '0.95rem', color: '#2c3e50', borderBottom: '2px solid', borderColor: '#667eea' }}>
            Account Opening Details
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5, maxWidth: 800 }}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              <TextField
                select
                label="Sub Head"
                name="subHead"
                value={formData.subHead}
                onChange={handleSubHeadChange}
                size="small"
                fullWidth
                disabled={subgroupsLoading}
                displayEmpty
                InputProps={{
                  placeholder: 'Select a sub head',
                }}
                renderValue={(value) => {
                  if (value === '') return <span style={{ color: '#999' }}>Select a sub head</span>;
                  const selected = subgroups.find((s) => s.subgrpcode === value);
                  return selected ? selected.subgrpname : value;
                }}
              >
                <MenuItem value="" disabled>
                  Select a sub head
                </MenuItem>
                {subgroups.map((subgroup) => (
                  <MenuItem key={subgroup.subgrpcode} value={subgroup.subgrpcode}>
                    {subgroup.subgrpname}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Branch"
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                size="small"
                fullWidth
                disabled={branchesLoading}
                displayEmpty
                InputProps={{
                  placeholder: 'Select a branch',
                }}
                renderValue={(value) => {
                  if (value === '') return <span style={{ color: '#999' }}>Select a branch</span>;
                  const selected = branches.find((b) => (b.branchid ?? b.branchcode) === value);
                  return selected ? selected.br_name : value;
                }}
              >
                <MenuItem value="" disabled>
                  Select a branch
                </MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.branchid ?? branch.branchcode} value={branch.branchid ?? branch.branchcode}>
                    {branch.br_name}
                  </MenuItem>
                ))}
              </TextField>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.25, borderRadius: 2, backgroundColor: '#f8f9fa', border: '1px solid #eceff1' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Item Number
                </Typography>
                <Typography sx={{ fontWeight: 900, color: '#000000', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                  {formData.itemNumber || '—'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.25, borderRadius: 2, backgroundColor: '#f8f9fa', border: '1px solid #eceff1' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Account Number
                </Typography>
                <Typography sx={{ fontWeight: 900, color: '#000000', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                  {formData.accountNumber || '—'}
                </Typography>
              </Box>
              <TextField
                label="Account Name"
                name="accountName"
                value={formData.accountName}
                onChange={handleInputChange}
                placeholder="Enter account name"
                size="small"
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 1, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                variant="contained"
                type="submit"
                disabled={isSaving}
                startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <AddCircleRoundedIcon />}
                sx={{
                  backgroundColor: '#667eea',
                  '&:hover': { backgroundColor: '#5568d3' },
                  fontWeight: 600,
                  paddingX: 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(102,126,234,0.35)',
                  textTransform: 'none',
                }}
              >
                {isSaving ? 'Submitting...' : 'Submit'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                sx={{
                  fontWeight: 600,
                  paddingX: 3,
                  borderRadius: 2,
                  boxShadow: 'none',
                  textTransform: 'none',
                  color: '#666',
                  borderColor: '#ccc',
                  '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' },
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Saving Overlay */}
      <Backdrop
        open={isSaving}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column', gap: 2 }}
      >
        <CircularProgress color="inherit" />
        <Typography sx={{ fontWeight: 600 }}>Submitting account...</Typography>
      </Backdrop>
    </Box>
  );
}

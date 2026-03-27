import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

export default function AddMemberAccount() {
  const [branches, setBranches] = useState([]);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [formData, setFormData] = useState({
    memberCode: '',
    memberName: '',
    product: '',
    currency: '',
    branch: '',
    itemNumber: '',
    accountNumber: '',
    accountName: '',
  });

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const response = await fetch('/api/remote-branches/branches');
        if (!response.ok) return;

        const payload = await response.json();
        const branchOptions = Array.from(
          new Set(
            (Array.isArray(payload) ? payload : [])
              .map((item) => (item?.br_name || item?.branchName || item?.name || '').toString().trim())
              .filter(Boolean),
          ),
        );

        setBranches(branchOptions);
      } catch {
        setBranches([]);
      }
    };

    loadBranches();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMemberCodeBlur = async () => {
    if (!formData.memberCode.trim()) {
      return;
    }

    setIsLoadingMember(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockMembers = {
        MEM001: 'John Doe',
        MEM002: 'Awa Jallow',
        MEM003: 'Lamin Sanyang',
        MEM004: 'Fatou Camara',
      };

      const foundName = mockMembers[formData.memberCode.trim().toUpperCase()];

      if (foundName) {
        setFormData((prev) => ({
          ...prev,
          memberName: foundName,
        }));
        setStatusMessage('Member details loaded successfully.');
        setStatusError(false);
      } else {
        setFormData((prev) => ({
          ...prev,
          memberName: '',
        }));
        setStatusMessage('Customer code not found.');
        setStatusError(true);
      }
    } catch {
      setFormData((prev) => ({
        ...prev,
        memberName: '',
      }));
      setStatusMessage('Failed to load member details.');
      setStatusError(true);
    } finally {
      setIsLoadingMember(false);
    }
  };

  const handleSave = async () => {
    if (
      !formData.memberCode.trim()
      || !formData.memberName.trim()
      || !formData.product.trim()
      || !formData.currency.trim()
      || !formData.branch.trim()
      || !formData.itemNumber.trim()
      || !formData.accountNumber.trim()
      || !formData.accountName.trim()
    ) {
      setStatusMessage('Please fill in all fields before saving.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatusMessage('Member account saved successfully.');
      setStatusError(false);
      notifySaveSuccess({
        page: 'Member Administration / Add Member Account',
        action: 'Save Member Account',
        message: 'Member account saved successfully.',
      });
    } catch (error) {
      setStatusMessage('Failed to save member account.');
      setStatusError(true);
      notifySaveError({
        page: 'Member Administration / Add Member Account',
        action: 'Save Member Account',
        message: 'Failed to save member account.',
        error,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
        Add Member Account
      </Typography>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 900 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <TextField
              label="Customer Code"
              name="memberCode"
              value={formData.memberCode}
              onChange={handleChange}
              onBlur={handleMemberCodeBlur}
              disabled={isLoadingMember}
              placeholder="e.g. MEM001"
            />
            <TextField
              label="Member Name"
              name="memberName"
              value={formData.memberName}
              InputProps={{ readOnly: true }}
              disabled
              sx={{ '& .MuiInputBase-input.Mui-disabled': { fontWeight: 700 } }}
            />

            <TextField select label="Select Product" name="product" value={formData.product} onChange={handleChange}>
              <MenuItem value="">Select product</MenuItem>
              <MenuItem value="savings">Savings Account</MenuItem>
              <MenuItem value="shares">Shares Account</MenuItem>
              <MenuItem value="fixed-deposit">Fixed Deposit</MenuItem>
              <MenuItem value="mobile-wallet">Mobile Wallet</MenuItem>
            </TextField>

            <TextField select label="Currency" name="currency" value={formData.currency} onChange={handleChange}>
              <MenuItem value="">Select currency</MenuItem>
              <MenuItem value="GMD">GMD</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="GBP">GBP</MenuItem>
            </TextField>

            <TextField
              select
              label="Branch"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => selected || 'Select branch',
              }}
            >
              <MenuItem value="" disabled>Select branch</MenuItem>
              {branches.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Item Number"
              name="itemNumber"
              value={formData.itemNumber}
              onChange={handleChange}
            />

            <TextField
              label="Account Number"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
            />
            <TextField
              label="Account Name"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
            />
          </Box>

          {statusMessage && (
            <Typography
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 1,
                bgcolor: statusError ? 'error.light' : 'success.light',
                color: statusError ? 'error.dark' : 'success.dark',
              }}
            >
              {statusMessage}
            </Typography>
          )}

          <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ mt: 2 }}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

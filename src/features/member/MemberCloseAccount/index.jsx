import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from '@mui/material';

export default function MemberCloseAccount() {
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    savingBalance: '',
    shareBalance: '',
    loanBalance: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberIdBlur = async () => {
    if (!formData.memberId.trim()) return;

    setIsLoadingMember(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockMembers = {
        MEM001: { firstName: 'John', middleName: 'Kwame', lastName: 'Doe' },
        MEM002: { firstName: 'Awa', middleName: 'Binta', lastName: 'Jallow' },
        MEM003: { firstName: 'Lamin', middleName: 'Ousman', lastName: 'Sanyang' },
        MEM004: { firstName: 'Fatou', middleName: 'Mariama', lastName: 'Camara' },
      };

      const found = mockMembers[formData.memberId.trim().toUpperCase()];

      if (found) {
        setFormData((prev) => ({
          ...prev,
          firstName: found.firstName,
          middleName: found.middleName,
          lastName: found.lastName,
        }));
        setStatusMessage('Member details loaded successfully.');
        setStatusError(false);
      } else {
        setFormData((prev) => ({ ...prev, firstName: '', middleName: '', lastName: '' }));
        setStatusMessage('Member ID not found.');
        setStatusError(true);
      }
    } catch {
      setFormData((prev) => ({ ...prev, firstName: '', middleName: '', lastName: '' }));
      setStatusMessage('Failed to load member details.');
      setStatusError(true);
    } finally {
      setIsLoadingMember(false);
    }
  };

  const handleSave = async () => {
    if (
      !formData.memberId.trim()
      || !formData.firstName.trim()
      || !formData.savingBalance.trim()
      || !formData.shareBalance.trim()
      || !formData.loanBalance.trim()
    ) {
      setStatusMessage('Please fill in all required fields.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatusMessage('Member account closed successfully.');
      setStatusError(false);
    } catch {
      setStatusMessage('Failed to close member account.');
      setStatusError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const readonlySx = { '& .MuiInputBase-input.Mui-disabled': { fontWeight: 700 } };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
        Member Close
      </Typography>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 900 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
            <TextField
              label="Member ID"
              name="memberId"
              value={formData.memberId}
              onChange={handleChange}
              onBlur={handleMemberIdBlur}
              disabled={isLoadingMember}
              placeholder="e.g. MEM001"
              helperText="Try: MEM001, MEM002, MEM003, or MEM004"
            />

            <Box />

            <TextField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              InputProps={{ readOnly: true }}
              disabled
              sx={readonlySx}
            />
            <TextField
              label="Middle Name"
              name="middleName"
              value={formData.middleName}
              InputProps={{ readOnly: true }}
              disabled
              sx={readonlySx}
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              InputProps={{ readOnly: true }}
              disabled
              sx={readonlySx}
            />

            <Box />

            <TextField
              label="Saving Balance"
              name="savingBalance"
              value={formData.savingBalance}
              onChange={handleChange}
            />
            <TextField
              label="Share Balance"
              name="shareBalance"
              value={formData.shareBalance}
              onChange={handleChange}
            />
            <TextField
              label="Loan Balance"
              name="loanBalance"
              value={formData.loanBalance}
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

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || !formData.firstName.trim()}
            sx={{ mt: 2 }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

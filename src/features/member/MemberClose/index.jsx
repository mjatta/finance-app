import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
} from '@mui/material';

export default function AccountClosure() {
  const [formData, setFormData] = useState({
    accountNumber: '',
    accountName: '',
    accountBalance: '',
    status: [],
  });
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);

  const statusOptions = ['Close', 'Inactive', 'Dormant', 'Frozen'];

  const handleAccountNumberBlur = async () => {
    if (!formData.accountNumber.trim()) {
      return;
    }

    setIsLoadingAccount(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      // Fake endpoint call - simulating account lookup
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Mock data response
      const mockAccounts = {
        'ACC001': { name: 'John Doe Savings Account', balance: '25,500.00' },
        'ACC002': { name: 'Jane Smith Checking Account', balance: '12,300.50' },
        'ACC003': { name: 'Business Operating Account', balance: '45,200.75' },
        'ACC004': { name: 'Emergency Fund Account', balance: '8,900.25' },
      };

      const accountData = mockAccounts[formData.accountNumber];

      if (accountData) {
        setFormData((prev) => ({
          ...prev,
          accountName: accountData.name,
          accountBalance: accountData.balance,
          status: [],
        }));
        setStatusMessage('Account details loaded successfully.');
        setStatusError(false);
      } else {
        setFormData((prev) => ({
          ...prev,
          accountName: '',
          accountBalance: '',
          status: [],
        }));
        setStatusMessage('Account number not found.');
        setStatusError(true);
      }
    } catch {
      setStatusMessage('Failed to load account details.');
      setStatusError(true);
      setFormData((prev) => ({
        ...prev,
        accountName: '',
        accountBalance: '',
        status: [],
      }));
    } finally {
      setIsLoadingAccount(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (event) => {
    const { value, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      status: checked
        ? [...prev.status, value]
        : prev.status.filter((s) => s !== value),
    }));
  };

  const handleSave = async () => {
    if (!formData.accountNumber.trim() || !formData.accountName.trim() || formData.status.length === 0) {
      setStatusMessage('Please fill in all required fields and select at least one status.');
      setStatusError(true);
      return;
    }

    setIsSaving(true);
    setStatusMessage('');
    setStatusError(false);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      setStatusMessage('Account closure saved successfully.');
      setStatusError(false);
    } catch {
      setStatusMessage('Failed to save account closure.');
      setStatusError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
        Account Closure
      </Typography>

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', maxWidth: 600 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Account Number"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              onBlur={handleAccountNumberBlur}
              disabled={isLoadingAccount}
              placeholder="e.g., ACC001"
              helperText="Try: ACC001, ACC002, ACC003, or ACC004"
            />

            <FormControl>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Account Status
              </Typography>
              <FormGroup row>
                {statusOptions.map((option) => (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        name={option}
                        value={option}
                        checked={formData.status.includes(option)}
                        onChange={handleStatusChange}
                      />
                    }
                    label={option}
                  />
                ))}
              </FormGroup>
            </FormControl>

            <TextField
              label="Account Name"
              name="accountName"
              value={formData.accountName}
              InputProps={{ readOnly: true }}
              disabled
              sx={{ '& .MuiInputBase-input.Mui-disabled': { fontWeight: 700 } }}
            />
            <TextField
              label="Account Balance"
              name="accountBalance"
              value={formData.accountBalance}
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
            disabled={isSaving || !formData.accountName.trim() || formData.status.length === 0}
            sx={{ mt: 2 }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { notifySaveError, notifySaveSuccess } from '../../../utils/saveNotifications';

const COLUMNS = [
  { field: 'accountNumber', headerName: 'Account Number', flex: 1, minWidth: 150 },
  { field: 'accountName', headerName: 'Account Name', flex: 1.5, minWidth: 200 },
  { field: 'accountBalance', headerName: 'Account Balance', flex: 1, minWidth: 150 },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
];

export default function AccountActivation() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      // In production, replace with actual API call
      // const response = await fetch('/api/accounts/activate');
      // const data = await response.json();

      // Mock data for development
      const mockAccounts = [
        {
          id: 1,
          accountNumber: 'ACC001',
          accountName: 'John Doe Savings Account',
          accountBalance: '25,500.00',
          status: 'PENDING',
        },
        {
          id: 2,
          accountNumber: 'ACC002',
          accountName: 'Jane Smith Checking Account',
          accountBalance: '12,300.50',
          status: 'ACTIVE',
        },
        {
          id: 3,
          accountNumber: 'ACC003',
          accountName: 'Business Operating Account',
          accountBalance: '45,200.75',
          status: 'PENDING',
        },
        {
          id: 4,
          accountNumber: 'ACC004',
          accountName: 'Emergency Fund Account',
          accountBalance: '8,900.25',
          status: 'INACTIVE',
        },
        {
          id: 5,
          accountNumber: 'ACC005',
          accountName: 'Corporate Account',
          accountBalance: '120,450.00',
          status: 'PENDING',
        },
      ];

      setAccounts(mockAccounts);
      setStatusMessage('');
      setStatusError(false);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      setStatusMessage('Failed to load accounts.');
      setStatusError(true);
      notifySaveError({
        page: 'Member Administration / Account Activation',
        action: 'Load Accounts',
        message: 'Failed to load accounts.',
        error,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateClick = () => {
    if (selectedIds.length === 0) {
      setStatusMessage('Please select at least one account to activate.');
      setStatusError(true);
      return;
    }

    // Validate that all selected accounts have PENDING status
    const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));
    const nonPendingAccounts = selectedAccounts.filter((a) => a.status !== 'PENDING');

    if (nonPendingAccounts.length > 0) {
      setStatusMessage(`Cannot activate accounts with status: ${nonPendingAccounts.map((a) => a.status).join(', ')}. Only PENDING accounts can be activated.`);
      setStatusError(true);
      return;
    }

    setOpenConfirmModal(true);
  };

  const handleConfirmActivate = async () => {
    setIsProcessing(true);
    setOpenConfirmModal(false);

    try {
      const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));

      // Call endpoint for each selected account
      for (let i = 0; i < selectedAccounts.length; i += 1) {
        // In production, replace with actual API endpoint
        // const response = await fetch(`/api/accounts/${selectedAccounts[i].id}/activate`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        // });

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Update local state to reflect status change
      const updatedAccounts = accounts.map((a) =>
        selectedIds.includes(a.id) ? { ...a, status: 'ACTIVE' } : a
      );
      setAccounts(updatedAccounts);

      setStatusMessage(
        `Successfully activated ${selectedAccounts.length} account${selectedAccounts.length > 1 ? 's' : ''}.`
      );
      setStatusError(false);
      setSelectedIds([]);

      notifySaveSuccess({
        page: 'Member Administration / Account Activation',
        action: 'Activate Accounts',
        message: `Successfully activated ${selectedAccounts.length} account(s).`,
      });
    } catch (error) {
      console.error('Failed to activate accounts:', error);
      setStatusMessage('Failed to activate selected accounts.');
      setStatusError(true);
      notifySaveError({
        page: 'Member Administration / Account Activation',
        action: 'Activate Accounts',
        message: 'Failed to activate selected accounts.',
        error,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedAccountDetails = accounts.filter((a) => selectedIds.includes(a.id));
  const pendingAccountsCount = accounts.filter((a) => a.status === 'PENDING').length;
  const activeAccountsCount = accounts.filter((a) => a.status === 'ACTIVE').length;
  const inactiveAccountsCount = accounts.filter((a) => a.status === 'INACTIVE').length;

  return (
    <Box p={3}>
      {/* Header Section */}
      <Box
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          color: 'white',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Account Activation
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Manage and activate member accounts efficiently
        </Typography>
      </Box>

      {/* Statistics Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: '#fff3e0',
            borderRadius: 1.5,
            border: '1px solid #ffe0b2',
          }}
        >
          <Typography variant="caption" sx={{ color: '#e65100', fontWeight: 600 }}>
            Pending
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#e65100' }}>
            {pendingAccountsCount}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            bgcolor: '#e8f5e9',
            borderRadius: 1.5,
            border: '1px solid #c8e6c9',
          }}
        >
          <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>
            Active
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32' }}>
            {activeAccountsCount}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            bgcolor: '#f3e5f5',
            borderRadius: 1.5,
            border: '1px solid #e1bee7',
          }}
        >
          <Typography variant="caption" sx={{ color: '#6a1b9a', fontWeight: 600 }}>
            Inactive
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#6a1b9a' }}>
            {inactiveAccountsCount}
          </Typography>
        </Box>
      </Box>

      {/* Instructions */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: '#e3f2fd',
          borderRadius: 1.5,
          border: '1px solid #bbdefb',
        }}
      >
        <Typography variant="body2" sx={{ color: '#1565c0' }}>
          💡 <strong>Tip:</strong> Click on any row to select/deselect accounts with PENDING status. Click the "Activate Selected" button to proceed with activation.
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleActivateClick}
          disabled={selectedIds.length === 0 || isProcessing}
          sx={{ 
            fontWeight: 600,
            paddingX: 3,
            boxShadow: 2,
          }}
        >
          {isProcessing ? 'Processing...' : `✓ Activate Selected (${selectedIds.length})`}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={loadAccounts}
          disabled={loading}
          sx={{ 
            fontWeight: 600,
            paddingX: 3,
          }}
        >
          {loading ? 'Loading...' : '↻ Refresh'}
        </Button>
      </Box>

      {statusMessage && (
        <Box
          sx={{
            mb: 2,
            p: 2.5,
            borderRadius: 1.5,
            bgcolor: statusError ? '#ffebee' : '#f1f8e9',
            borderLeft: `4px solid ${statusError ? '#c62828' : '#558b2f'}`,
            border: `1px solid ${statusError ? '#ef5350' : '#9ccc65'}`,
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: statusError ? '#c62828' : '#558b2f',
              fontWeight: 500
            }}
          >
            {statusError ? '❌' : '✅'} {statusMessage}
          </Typography>
        </Box>
      )}

      <Box 
        sx={{ 
          height: 400, 
          width: '100%',
          borderRadius: 1.5,
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}
      >
        <DataGrid
          rows={accounts}
          columns={COLUMNS}
          loading={loading}
          pageSizeOptions={[5, 10, 25]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          hideFooter
          onRowClick={(params) => {
            const accountId = params.id;
            if (selectedIds.includes(accountId)) {
              setSelectedIds(selectedIds.filter((id) => id !== accountId));
            } else {
              setSelectedIds([...selectedIds, accountId]);
            }
          }}
          getRowClassName={(params) => {
            if (selectedIds.includes(params.id)) {
              return 'selected-row';
            }
            return '';
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#ffffff',
            },
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: '#2c3e50',
              borderBottom: '2px solid #1a252f',
            },
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&.selected-row': {
                backgroundColor: '#bbdefb',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#90caf9',
                },
              },
              '&:nth-of-type(odd)': {
                backgroundColor: '#fafafa',
              },
              '&:nth-of-type(even)': {
                backgroundColor: '#ffffff',
              },
              '&:hover': {
                backgroundColor: '#f0f0f0 !important',
              },
            },
          }}
        />
      </Box>

      {/* Confirmation Modal */}
      <Dialog open={openConfirmModal} onClose={() => setOpenConfirmModal(false)} maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Activation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to activate the following account{selectedAccountDetails.length > 1 ? 's' : ''}?
          </Typography>
          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
            {selectedAccountDetails.map((account) => (
              <Typography key={account.id} variant="body2" sx={{ mb: 1 }}>
                • {account.accountNumber} - {account.accountName}
              </Typography>
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2 }}>
            This action will change their status from PENDING to ACTIVE.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmModal(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmActivate}
            variant="contained"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
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
import { useMembersForActivation } from './Hooks/useMembersForActivation';
import { useUpdateCustomerAuthorisation } from './Hooks/useUpdateCustomerAuthorisation';

const COLUMNS = [
  { field: 'customerCode', headerName: 'Customer Code', flex: 1, minWidth: 150, sortable: true },
  { field: 'name', headerName: 'Name', flex: 1.5, minWidth: 200, sortable: true },
  { field: 'dateJoined', headerName: 'Date Joined', flex: 1, minWidth: 140, sortable: true },
  { field: 'dateOfBirth', headerName: 'Date of Birth', flex: 1, minWidth: 140, sortable: true },
  { field: 'phoneNumber', headerName: 'Phone Number', flex: 1, minWidth: 150, sortable: true },
  { field: 'status', headerName: 'Status', flex: 1, minWidth: 120, sortable: true },
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

  const [sortModel, setSortModel] = useState([]);

  const { fetchMembersForActivation } = useMembersForActivation();
  const { updateAuthorisation } = useUpdateCustomerAuthorisation();

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMembersForActivation();

      if (!data || data.length === 0) {
        setAccounts([]);
        setStatusMessage('No members pending activation.');
        setStatusError(false);
        return;
      }

      // Transform API response to table rows
      const members = data.map((item, index) => ({
        id: item.ccustcode || index,
        customerCode: item.ccustcode?.trim() || '',
        name: [item.ccustfname, item.ccustmname, item.ccustlname]
          .filter((v) => v && v.trim())
          .join(' ')
          .trim(),
        dateJoined: item.datejoin || '',
        dateOfBirth: item.ddatebirth || '',
        phoneNumber: item.ctel?.trim() || '',
        status: 'PENDING',
      }));

      setAccounts(members);
      setStatusMessage('');
      setStatusError(false);
    } catch (error) {
      console.error('Failed to load members:', error);
      setStatusMessage('Failed to load member data.');
      setStatusError(true);
      notifySaveError({
        page: 'Member Administration / Account Activation',
        action: 'Load Members',
        message: 'Failed to load member data.',
        error,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchMembersForActivation]);

  // Load members on mount only
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleActivateClick = () => {
    if (selectedIds.length === 0) {
      setStatusMessage('Please select at least one member to activate.');
      setStatusError(true);
      return;
    }

    // Validate that all selected members have PENDING status
    const selectedMembers = accounts.filter((a) => selectedIds.includes(a.id));
    const nonPendingMembers = selectedMembers.filter((a) => a.status !== 'PENDING');

    if (nonPendingMembers.length > 0) {
      setStatusMessage(`Cannot activate members with status: ${nonPendingMembers.map((a) => a.status).join(', ')}. Only PENDING members can be activated.`);
      setStatusError(true);
      return;
    }

    setOpenConfirmModal(true);
  };

  const handleConfirmActivate = async () => {
    setIsProcessing(true);
    setOpenConfirmModal(false);

    try {
      const selectedMembers = accounts.filter((a) => selectedIds.includes(a.id));
      const failedMembers = [];

      // Call UpdateCustomerAuthorisation endpoint for each selected member
      for (let i = 0; i < selectedMembers.length; i += 1) {
        const result = await updateAuthorisation(selectedMembers[i].customerCode);
        if (!result.success) {
          failedMembers.push(selectedMembers[i].customerCode);
        }
        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // If any requests failed, show error and don't refresh
      if (failedMembers.length > 0) {
        setStatusMessage(
          `Failed to activate ${failedMembers.length} member(s): ${failedMembers.join(', ')}`
        );
        setStatusError(true);
        return;
      }

      // All requests succeeded - refresh the datatable
      setSelectedIds([]);
      setStatusMessage(
        `Successfully activated ${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''}.`
      );
      setStatusError(false);

      notifySaveSuccess({
        page: 'Member Administration / Account Activation',
        action: 'Activate Members',
        message: `Successfully activated ${selectedMembers.length} member(s).`,
      });

      // Refresh the datatable to remove activated members
      await loadAccounts();
    } catch (error) {
      console.error('Failed to activate members:', error);
      setStatusMessage('Failed to activate selected members.');
      setStatusError(true);
      notifySaveError({
        page: 'Member Administration / Account Activation',
        action: 'Activate Members',
        message: 'Failed to activate selected members.',
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
          Member Activation
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Activate pending members and manage their account status
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
          💡 <strong>Tip:</strong> Click on any row to select/deselect members with PENDING status. Click the "Activate Selected" button to proceed with activation.
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
          height: 450, 
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
          sortModel={sortModel}
          onSortModelChange={setSortModel}
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
            '& .MuiDataGrid-footerContainer': {
              backgroundColor: '#f5f5f5',
              borderTop: '1px solid #e0e0e0',
              fontWeight: 500,
            },
            '& .MuiDataGrid-toolbarContainer': {
              padding: '8px',
              color: '#2c3e50',
            },
            '& .MuiTablePagination-root': {
              color: '#2c3e50',
              fontWeight: 500,
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              margin: '0 8px',
              fontSize: '0.875rem',
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
            Are you sure you want to activate the following member{selectedAccountDetails.length > 1 ? 's' : ''}?
          </Typography>
          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
            {selectedAccountDetails.map((member) => (
              <Typography key={member.id} variant="body2" sx={{ mb: 1 }}>
                • {member.customerCode} - {member.name}
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

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import accessControlData from '../../../data/access-control-groups.json';

export default function AccessControlGroups({ user }) {
  const groups = Array.isArray(accessControlData?.groups) ? accessControlData.groups : [];
  const users = Array.isArray(accessControlData?.users) ? accessControlData.users : [];
  const roles = Array.isArray(accessControlData?.roles) ? accessControlData.roles : [];
  const initialLinks = Array.isArray(accessControlData?.groupUsers) ? accessControlData.groupUsers : [];

  const [groupUsers, setGroupUsers] = useState(initialLinks);
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '');
  const [message, setMessage] = useState('');

  const isReadOnlyRole = Boolean(user?.access?.readOnly);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || null;

  const usersInSelectedGroup = (() => {
    const linkUserIds = groupUsers
      .filter((item) => item.groupId === selectedGroupId)
      .map((item) => item.userId);

    return users.filter((item) => linkUserIds.includes(item.id));
  })();

  const addUserToGroup = () => {
    if (!selectedGroupId || !selectedUserId || isReadOnlyRole) {
      return;
    }

    const exists = groupUsers.some(
      (item) => item.groupId === selectedGroupId && item.userId === selectedUserId,
    );

    if (exists) {
      setMessage('Selected user is already in this group.');
      return;
    }

    setGroupUsers((prev) => [...prev, { groupId: selectedGroupId, userId: selectedUserId }]);
    setMessage('User added to existing group successfully.');
  };

  const removeUserFromGroup = () => {
    if (!selectedGroupId || !selectedUserId || isReadOnlyRole) {
      return;
    }

    const exists = groupUsers.some(
      (item) => item.groupId === selectedGroupId && item.userId === selectedUserId,
    );

    if (!exists) {
      setMessage('Selected user is not in this group.');
      return;
    }

    setGroupUsers((prev) =>
      prev.filter(
        (item) => !(item.groupId === selectedGroupId && item.userId === selectedUserId),
      ),
    );
    setMessage('User removed from existing group successfully.');
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Access Control Groups
      </Typography>

      {isReadOnlyRole && (
        <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontWeight: 700 }}>
          Read-only access: you can view groups and memberships, but cannot update group users.
        </Typography>
      )}

      {message && (
        <Typography
          variant="body2"
          sx={{ mb: 2, fontWeight: 700 }}
          color={message.toLowerCase().includes('successfully') ? 'success.main' : 'warning.main'}
        >
          {message}
        </Typography>
      )}

      <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
            Group users
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              select
              label="Existing group"
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                setMessage('');
              }}
              sx={{ flex: '1 1 260px', minWidth: 240 }}
            >
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.groupName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="User"
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setMessage('');
              }}
              sx={{ flex: '1 1 260px', minWidth: 240 }}
            >
              {users.map((entry) => (
                <MenuItem key={entry.id} value={entry.id}>
                  {entry.fullName} ({entry.username})
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={addUserToGroup} disabled={isReadOnlyRole}>
                Add user to existing group
              </Button>
              <Button variant="outlined" color="error" onClick={removeUserFromGroup} disabled={isReadOnlyRole}>
                Remove user from existing group
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' } }}>
        <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.25, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              User Groups
            </Typography>
          </Box>
          <div style={{ height: 320, width: '100%' }}>
            <DataGrid
              rows={groups.map((g) => ({ ...g }))}
              columns={[
                { field: 'groupName', headerName: 'Group Name', flex: 1, minWidth: 120 },
                { field: 'description', headerName: 'Description', flex: 1, minWidth: 150 },
              ]}
              pageSizeOptions={[10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              density="compact"
              onRowClick={(params) => { setSelectedGroupId(params.row.id); setMessage(''); }}
              getRowClassName={(params) => params.row.id === selectedGroupId ? 'selected-group' : ''}
              sx={{
                cursor: 'pointer',
                '& .MuiDataGrid-columnHeader': { backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 },
                '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f8f9fa' },
                '& .MuiDataGrid-row:hover': { backgroundColor: '#e9ecef' },
                '& .MuiDataGrid-cell': { borderColor: '#dee2e6' },
                '& .selected-group': { backgroundColor: '#cfe2ff !important' },
              }}
            />
          </div>
        </Paper>

        <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.25, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Users in selected group{selectedGroup ? ` (${selectedGroup.groupName})` : ''}
            </Typography>
          </Box>
          <div style={{ height: 320, width: '100%' }}>
            <DataGrid
              rows={usersInSelectedGroup.map((u) => ({ ...u }))}
              columns={[
                { field: 'username', headerName: 'Username', flex: 1, minWidth: 120 },
                { field: 'fullName', headerName: 'Full Name', flex: 1, minWidth: 150 },
              ]}
              pageSizeOptions={[10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              density="compact"
              onRowClick={(params) => setSelectedUserId(params.row.id)}
              getRowClassName={(params) => params.row.id === selectedUserId ? 'selected-user' : ''}
              sx={{
                cursor: 'pointer',
                '& .MuiDataGrid-columnHeader': { backgroundColor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 },
                '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#f8f9fa' },
                '& .MuiDataGrid-row:hover': { backgroundColor: '#e9ecef' },
                '& .MuiDataGrid-cell': { borderColor: '#dee2e6' },
                '& .selected-user': { backgroundColor: '#cfe2ff !important' },
              }}
            />
          </div>
        </Paper>

        <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.25, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              System Roles
            </Typography>
          </Box>
          <div style={{ height: 320, width: '100%' }}>
            <DataGrid
              rows={roles.map((r) => ({ ...r }))}
              columns={[
                { field: 'roleName', headerName: 'Role Name', flex: 1, minWidth: 120 },
                { field: 'description', headerName: 'Description', flex: 1, minWidth: 150 },
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
        </Paper>
      </Box>
    </Box>
  );
}

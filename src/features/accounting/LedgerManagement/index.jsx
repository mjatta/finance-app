import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import useGlManagement from './hooks/useGlManagement';

function CategoryRow({ category }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
        <TableCell sx={{ width: '40px' }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
            sx={{ color: '#1976d2' }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 700, backgroundColor: '#f1f5f9', color: '#0f172a' }}>
          {category.Code}
        </TableCell>
        <TableCell sx={{ fontWeight: 700, backgroundColor: '#f1f5f9', color: '#0f172a' }}>
          {String(category.CategoryName || '').trim()}
        </TableCell>
        <TableCell sx={{ backgroundColor: '#f1f5f9' }}></TableCell>
        <TableCell sx={{ backgroundColor: '#f1f5f9' }}></TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <TableContainer component={Paper} sx={{ backgroundColor: '#fafbfc' }}>
                <Table size="small" sx={{ backgroundColor: 'white' }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#e8eef5' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                        Sub Group Code
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                        Sub Group Name
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(category.SubGroups) && category.SubGroups.length > 0 ? (
                      category.SubGroups.map((subGroup, idx) => (
                        <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#f9fafc' } }}>
                          <TableCell sx={{ color: '#475569', fontSize: '0.9rem' }}>
                            {subGroup.SubGrpCode}
                          </TableCell>
                          <TableCell sx={{ color: '#475569', fontSize: '0.9rem' }}>
                            {String(subGroup.SubGrpName || '').trim()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} sx={{ textAlign: 'center', color: '#999' }}>
                          No sub groups
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function LedgerManagement() {
  const { fetchGlData, loading, error } = useGlManagement();
  const [glData, setGlData] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      const data = await fetchGlData(30);
      if (data && mounted) {
        setGlData(data);
      }
    })();
    return () => { mounted = false };
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const caption = glData?.Caption || 'General Ledger Management';
  const categories = glData?.Categories || [];
  const financialPeriod = glData?.FinancialPeriod || {};

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            {caption}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            Chart of Accounts and General Ledger Management
          </Typography>
        </CardContent>
      </Card>

      {financialPeriod && (
        <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Financial Period Start:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {financialPeriod.StartDate
                    ? new Date(financialPeriod.StartDate).toISOString().split('T')[0]
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Financial Period End:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {financialPeriod.EndDate
                    ? new Date(financialPeriod.EndDate).toISOString().split('T')[0]
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Number of Periods:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {financialPeriod.NumberOfPeriods || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  Current Period:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {financialPeriod.CurrentPeriod || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Account Categories and Sub Groups
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: 'white', borderRadius: 0 }}>
            <Table sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                  <TableCell sx={{ width: '40px' }}></TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>Category Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>Sub Groups</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((category, idx) => (
                    <CategoryRow key={idx} category={category} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: '#999' }}>
                      No categories available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

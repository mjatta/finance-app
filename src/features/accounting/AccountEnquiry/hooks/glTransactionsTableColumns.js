// DataGrid columns for GL Transactions
// For use with MUI DataGrid or similar table
import dayjs from 'dayjs';

export const glTransactionsTableColumns = [
  {
    field: 'PostDate',
    headerName: 'Post Date',
    minWidth: 120,
    flex: 1,
    valueGetter: (params) => (params.row && params.row.PostDate ? dayjs(params.row.PostDate).format('DD-MM-YYYY') : ''),
  },
  {
    field: 'ValueDate',
    headerName: 'Value Date',
    minWidth: 120,
    flex: 1,
    valueGetter: (params) => (params.row && params.row.ValueDate ? dayjs(params.row.ValueDate).format('DD-MM-YYYY') : ''),
  },
  {
    field: 'Debit',
    headerName: 'Debit',
    minWidth: 100,
    flex: 1,
    type: 'number',
    valueFormatter: ({ value }) => value ? value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '',
  },
  {
    field: 'Credit',
    headerName: 'Credit',
    minWidth: 100,
    flex: 1,
    type: 'number',
    valueFormatter: ({ value }) => value ? value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '',
  },
  {
    field: 'NewBalance',
    headerName: 'New Balance',
    minWidth: 120,
    flex: 1,
    type: 'number',
    valueFormatter: ({ value }) => value ? value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '',
  },
  {
    field: 'Description',
    headerName: 'Description',
    minWidth: 200,
    flex: 2,
    valueGetter: (params) => params.row && params.row.Description ? params.row.Description.trim() : '',
  },
  {
    field: 'VoucherNo',
    headerName: 'Voucher Number',
    minWidth: 140,
    flex: 1,
    valueGetter: (params) => params.row && params.row.VoucherNo ? params.row.VoucherNo.trim() : '',
  },
];

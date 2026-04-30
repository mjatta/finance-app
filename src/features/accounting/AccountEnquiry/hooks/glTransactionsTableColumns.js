// DataGrid columns for GL Transactions
// For use with MUI DataGrid or similar table

export const glTransactionsTableColumns = [
  {
    field: 'PostDate',
    headerName: 'Post Date',
    minWidth: 120,
    flex: 1,
    valueGetter: (params) => params.row && params.row.PostDate ? new Date(params.row.PostDate).toLocaleDateString() : '',
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

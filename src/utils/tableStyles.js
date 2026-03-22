/**
 * Bootstrap-style table styling utilities
 * Provides consistent, professional table appearance with dark headers and alternating row colors
 */

// Bootstrap color palette (accessible friendly colors)
export const BOOTSTRAP_TABLE_COLORS = {
  headerBg: 'primary.main',        // Dark gray header background (more accessible than #212529)
  headerText: '#ffffff',      // White header text (18:1 contrast ratio)
  rowLight: '#ffffff',        // Light row background
  rowDark: '#f8f9fa',         // Slightly darker row background (Bootstrap's gray-50)
  border: '#dee2e6',          // Bootstrap border color
  hoverBg: '#e9ecef',         // Bootstrap gray-200
};

// Styles for table head rows
export const tableHeadRowSx = {
  backgroundColor: BOOTSTRAP_TABLE_COLORS.headerBg,
  '& .MuiTableCell-head': {
    backgroundColor: BOOTSTRAP_TABLE_COLORS.headerBg,
    color: BOOTSTRAP_TABLE_COLORS.headerText,
    fontWeight: 700,
    fontSize: '0.875rem',
    borderColor: BOOTSTRAP_TABLE_COLORS.border,
  },
};

// Styles for table body with alternating row colors
export const getTableBodyRowSx = (index) => ({
  backgroundColor: index % 2 === 0 ? BOOTSTRAP_TABLE_COLORS.rowLight : BOOTSTRAP_TABLE_COLORS.rowDark,
  '&:hover': {
    backgroundColor: BOOTSTRAP_TABLE_COLORS.hoverBg,
  },
  borderColor: BOOTSTRAP_TABLE_COLORS.border,
  '& .MuiTableCell-body': {
    borderColor: BOOTSTRAP_TABLE_COLORS.border,
    fontSize: '0.875rem',
  },
});

// Styles for sticky header tables (used in scrollable tables)
export const stickyHeaderTableHeadSx = {
  '& .MuiTableCell-head': {
    backgroundColor: BOOTSTRAP_TABLE_COLORS.headerBg,
    color: BOOTSTRAP_TABLE_COLORS.headerText,
    fontWeight: 700,
    fontSize: '0.875rem',
    borderColor: BOOTSTRAP_TABLE_COLORS.border,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
};

// Styles for table containers
export const tableContainerSx = {
  border: `1px solid ${BOOTSTRAP_TABLE_COLORS.border}`,
  borderRadius: 1.5,
  backgroundColor: BOOTSTRAP_TABLE_COLORS.rowLight,
};

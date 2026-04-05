import { cloneElement, isValidElement, lazy, Suspense, useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import ToggleOnRoundedIcon from '@mui/icons-material/ToggleOnRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import OutboxRoundedIcon from '@mui/icons-material/OutboxRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded';
import BookRoundedIcon from '@mui/icons-material/BookRounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import BalanceRoundedIcon from '@mui/icons-material/BalanceRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import GroupWorkRoundedIcon from '@mui/icons-material/GroupWorkRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import logo from './assets/company-logo.jpg';
import './App.css';

// feature pages (lazy-loaded)
const DepositManagement = lazy(() => import('./features/member/DepositManagement'));
const AccountEnquiries = lazy(() => import('./features/member/AccountEnquiries'));
const MemberTransfer = lazy(() => import('./features/member/MemberTransfer'));
const Reprint = lazy(() => import('./features/member/Reprint'));
const CustomerRegistration = lazy(() => import('./features/member/CustomerRegistration'));
const AddMemberAccount = lazy(() => import('./features/member/AddMemberAccount'));
const MemberActivate = lazy(() => import('./features/member/MemberActivate'));
const MemberCloseAccount = lazy(() => import('./features/member/MemberCloseAccount'));
const AccountActivation = lazy(() => import('./features/member/AccountActivation'));
const Withdrawal = lazy(() => import('./features/member/Withdrawal'));
const MemberClose = lazy(() => import('./features/member/MemberClose'));
const MemberPayrollManagement = lazy(() => import('./features/member/MemberPayrollManagement'));

const Repayments = lazy(() => import('./features/loan/Repayments'));
const LoanChangeOff = lazy(() => import('./features/loan/LoanChangeOff'));
const RecoveryWriteOff = lazy(() => import('./features/loan/RecoveryWriteOff'));
const LoanReporting = lazy(() => import('./features/loan/Reporting'));
const LoanActivate = lazy(() => import('./features/loan/LoanActivate'));
const LoanAmortization = lazy(() => import('./features/loan/LoanAmortization'));
const LoanApplication = lazy(() => import('./features/loan/LoanApplication'));
const LoanApproval = lazy(() => import('./features/loan/LoanApproval'));
const LoanDisbursement = lazy(() => import('./features/loan/LoanDisbursement'));
const LoanGuarantor = lazy(() => import('./features/loan/LoanGuarantor'));
const LoanApplicationReschedule = lazy(() => import('./features/loan/LoanApplicationReschedule'));
const LoanApplicationTopUp = lazy(() => import('./features/loan/LoanApplicationTopUp'));

const SubscriptionProcessing = lazy(() => import('./features/accounting/PeriodicProcessing/SubscriptionProcessing'));
const InterestCalculation = lazy(() => import('./features/accounting/PeriodicProcessing/InterestCalculation'));
const PeriodDues = lazy(() => import('./features/accounting/PeriodicProcessing/PeriodDues'));
const CashManager = lazy(() => import('./features/accounting/CashManager'));
const Journals = lazy(() => import('./features/accounting/Journals'));
const TransactionUpdate = lazy(() => import('./features/accounting/TransactionUpdate'));
const TransactionReversalAdjustment = lazy(() => import('./features/accounting/TransactionReversalAdjustment'));
const AccountEnquiry = lazy(() => import('./features/accounting/AccountEnquiry'));
const GeneralLedger = lazy(() => import('./features/accounting/LedgerManagement'));
const AccountReconciliation = lazy(() => import('./features/accounting/Reconciliation'));

const UserSecurity = lazy(() => import('./features/system/UserSecurity'));
const UserSetup = lazy(() => import('./features/system/UserSetup'));
const EndOfYear = lazy(() => import('./features/system/EndOfYear'));
const RunningBalanceFix = lazy(() => import('./features/system/RunningBalanceFix'));
const AccessControlGroups = lazy(() => import('./features/system/AccessControlGroups'));
const AccessDenied = lazy(() => import('./features/system/AccessDenied'));
const ProductDefinition = lazy(() => import('./features/system/ModuleSetup/ProductDefinition'));
const SaveLogs = lazy(() => import('./features/system/SaveLogs'));

const Reporting = lazy(() => import('./features/reporting'));
const ReportingAnalytics = lazy(() => import('./features/reporting/Analytics'));
const Landing = lazy(() => import('./features/home/Landing'));
const Login = lazy(() => import('./features/auth/Login'));
const ChangePassword = lazy(() => import('./features/auth/ChangePassword'));

const deriveCategoryFromPath = (pathname) => {
  const firstSegment = pathname.split('/').filter(Boolean)[0] || null;
  const allowedKeys = ['member', 'loan', 'accounting', 'processing', 'system', 'reporting'];
  return allowedKeys.includes(firstSegment) ? firstSegment : null;
};

const normalizePathname = (pathname) => {
  const clean = String(pathname || '').split('?')[0].split('#')[0];
  if (!clean || clean === '/') {
    return '/';
  }

  return clean.endsWith('/') ? clean.slice(0, -1) : clean;
};

const normalizePermission = (permission) => {
  const value = String(permission || '').trim().toLowerCase();
  if (value === 'hide feature' || value === 'hide page' || value === 'hide') {
    return 'hide';
  }
  if (value === 'view' || value === 'view only' || value === 'read' || value === 'read only') {
    return 'read';
  }
  if (value === 'write') {
    return 'write';
  }
  return '';
};

function App() {
  const pageLoader = (
    <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress size={28} />
    </Box>
  );

  const [user, setUser] = useState(() => {
    const match = document.cookie.split('; ').find((c) => c.startsWith('user='));
    if (!match) {
      return null;
    }
    try {
      const value = decodeURIComponent(match.split('=')[1]);
      return JSON.parse(value);
    } catch (e) {
      console.error('failed to parse user cookie', e);
      return null;
    }
  });
  const [activeCategoryOverride, setActiveCategoryOverride] = useState(null);
  const [isSideNavCollapsed, setIsSideNavCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const activeCategory = activeCategoryOverride || deriveCategoryFromPath(location.pathname);

  const handleLogin = (userInfo) => {
    setUser(userInfo);
    // store in cookie for 1 hour
    const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
    document.cookie = `user=${encodeURIComponent(JSON.stringify(userInfo))}; expires=${expires}; path=/`;
    navigate('/home');
  };

  const handlePasswordChanged = () => {
    setUser((prev) => {
      if (!prev) {
        return prev;
      }

      const nextUser = {
        ...prev,
        mustChangePassword: false,
      };

      const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
      document.cookie = `user=${encodeURIComponent(JSON.stringify(nextUser))}; expires=${expires}; path=/`;
      return nextUser;
    });

    navigate('/home');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveCategoryOverride(null);
    // remove cookie by setting past expiration
    document.cookie = `user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    navigate('/login');
  };

  // ensure we redirect based on auth state
  if (!user) {
    // unauthenticated: always show login
    return (
      <Suspense fallback={pageLoader}>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // if user must change temporary password, force redirect (except super.user)
  if (user?.mustChangePassword && user?.username !== 'super.user' && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // if user is logged in but on login path, send them home
  if (user && location.pathname === '/login') {
    return <Navigate to="/home" replace />;
  }

  const categories = [
    {
      key: 'member',
      label: 'Member Administration',
      children: [
        { label: 'Registration', to: '/member/customer-registration', icon: HowToRegRoundedIcon },
        { label: 'Account Activation', to: '/member/member-activation', icon: ToggleOnRoundedIcon },
        { label: 'Deposits', to: '/member/deposits', icon: SavingsRoundedIcon },
        { label: 'Withdrawal', to: '/member/withdrawal', icon: PaymentsRoundedIcon },
        { label: 'Account Enquiries', to: '/member/account-enquiries', icon: ManageSearchRoundedIcon },
        { label: 'Add Member Account', to: '/member/add-member-account', icon: PersonAddRoundedIcon },
        { label: 'Member Activate', to: '/member/member-activate', icon: ToggleOnRoundedIcon },
        { label: 'Member Transfer', to: '/member/transfer', icon: SwapHorizRoundedIcon },
        { label: 'Member Payroll Management', to: '/member/member-payroll-management', icon: ReceiptLongRoundedIcon },
        { label: 'Reprint', to: '/member/reprint', icon: PrintRoundedIcon },
        { label: 'Member Close', to: '/member/member-close-account', icon: PersonRemoveRoundedIcon },
        { label: 'Account Closure', to: '/member/member-close', icon: PersonRemoveRoundedIcon },
      ],
    },
    {
      key: 'loan',
      label: 'Loan Management',
      children: [
        { label: 'Loan Application', to: '/loan/application', icon: DescriptionRoundedIcon },
        { label: 'Loan Guarantor', to: '/loan/guarantor', icon: GroupWorkRoundedIcon },
        { label: 'Loan Amortization', to: '/loan/amortization', icon: CalculateRoundedIcon },
        { label: 'Loan Approval', to: '/loan/approval', icon: VerifiedRoundedIcon },
        { label: 'Loan Activate', to: '/loan/activate', icon: TaskAltRoundedIcon },
        { label: 'Loan Disbursement', to: '/loan/disbursement', icon: OutboxRoundedIcon },
        { label: 'Loan Repayments', to: '/loan/repayments', icon: PaymentsRoundedIcon },
        { label: 'Loan Application Reschedule', to: '/loan/application-reschedule', icon: ScheduleRoundedIcon },
        { label: 'Loan Application Top up', to: '/loan/application-top-up', icon: TrendingUpRoundedIcon },
        { label: 'Loan Change off', to: '/loan/change-off', icon: BlockRoundedIcon },
        { label: 'Recovery/Write-off', to: '/loan/recovery', icon: AssignmentReturnRoundedIcon },
        { label: 'Loan Reporting', to: '/loan/reporting', icon: AssessmentRoundedIcon },
      ],
    },
    {
      key: 'accounting',
      label: 'Financial Accounting',
      children: [
        { label: 'Cash Manager', to: '/accounting/cash-manager', icon: PointOfSaleRoundedIcon },
        { label: 'Journals', to: '/accounting/journals', icon: BookRoundedIcon },
        { label: 'Transaction Update', to: '/accounting/transaction-update', icon: SyncAltRoundedIcon },
        { label: 'Transaction Reversal / Adjustment', to: '/accounting/transaction-reversal-adjustment', icon: UndoRoundedIcon },
        { label: 'Account Enquiry', to: '/accounting/account-enquiry', icon: ManageSearchRoundedIcon },
        { label: 'General Ledger', to: '/accounting/general-ledger', icon: AccountBalanceRoundedIcon },
        { label: 'Account Reconciliation', to: '/accounting/account-reconciliation', icon: BalanceRoundedIcon },
      ],
    },
    {
      key: 'processing',
      label: 'Processing',
      children: [
        { label: 'Periodic Subscription Processing', to: '/processing/subscription', icon: AutorenewRoundedIcon },
        { label: 'Interest Calculation', to: '/processing/interest', icon: CalculateRoundedIcon },
        { label: 'Period Processing Period Dues', to: '/processing/period-dues', icon: EventRepeatRoundedIcon },
      ],
    },
    {
      key: 'system',
      label: 'System Administration',
      children: [
        { label: 'Product Setup', to: '/system/product', icon: Inventory2RoundedIcon },
        { label: 'User Setup', to: '/system/user-setup', icon: PersonAddAlt1RoundedIcon },
        { label: 'Access Control Groups', to: '/system/access-control-groups', icon: GroupWorkRoundedIcon },
        { label: 'Security', to: '/system/security', icon: SecurityRoundedIcon },
        { label: 'Save Logs', to: '/system/save-logs', icon: ListAltRoundedIcon },
        { label: 'Running Balance Fix', to: '/system/running-balance-fix', icon: TuneRoundedIcon },
        { label: 'End of Year', to: '/system/end-of-year', icon: DateRangeRoundedIcon },
      ],
    },
    {
      key: 'reporting',
      label: 'Reporting & Analytics',
      children: [
        { label: 'Reporting', to: '/reporting', icon: AssessmentRoundedIcon },
        { label: 'Analytics', to: '/reporting/analytics', icon: InsightsRoundedIcon },
      ],
    },
  ];

  const getFeaturePermission = (featureKey) => {
    if (user?.access?.allPages) {
      return 'write';
    }

    const explicitPermission = normalizePermission(user?.access?.featurePermissions?.[featureKey]);
    if (explicitPermission) {
      return explicitPermission;
    }

    if (user?.access?.features?.includes(featureKey)) {
      return user?.access?.readOnly ? 'read' : 'write';
    }

    if (featureKey === 'processing') {
      const accountingPermission = normalizePermission(user?.access?.featurePermissions?.accounting);
      if (accountingPermission) {
        return accountingPermission;
      }

      if (user?.access?.features?.includes('accounting')) {
        return user?.access?.readOnly ? 'read' : 'write';
      }
    }

    return 'hide';
  };

  const canAccessFeature = (featureKey) => getFeaturePermission(featureKey) !== 'hide';
  const pagePermissions = user?.access?.pagePermissions || {};

  const getPagePermission = (featureKey, pagePath) => {
    if (user?.access?.allPages) {
      return 'write';
    }

    const normalizedPath = normalizePathname(pagePath);
    const explicitPagePermission = normalizePermission(pagePermissions?.[normalizedPath]);
    if (explicitPagePermission) {
      return explicitPagePermission;
    }

    return getFeaturePermission(featureKey);
  };

  const canAccessPage = (featureKey, pagePath) => getPagePermission(featureKey, pagePath) !== 'hide';
  const isPageReadOnly = (featureKey, pagePath) => getPagePermission(featureKey, pagePath) === 'read';

  const hasAccessiblePages = (featureKey) => {
    const category = categories.find((cat) => cat.key === featureKey);
    if (!category) {
      return false;
    }

    return category.children.some((child) => canAccessPage(featureKey, child.to));
  };

  const allowedCategories = categories.filter(
    (cat) => canAccessFeature(cat.key) || hasAccessiblePages(cat.key),
  );

  const renderWithAccess = (featureKey, element, pagePath = location.pathname) =>
    canAccessPage(featureKey, pagePath)
      ? (() => {
          const effectiveReadOnly = isPageReadOnly(featureKey, pagePath);

          const scopedUser = {
            ...user,
            access: {
              ...(user?.access || {}),
              readOnly: effectiveReadOnly,
              currentFeature: featureKey,
              currentPage: normalizePathname(pagePath),
            },
          };

          const scopedElement = isValidElement(element)
            ? cloneElement(element, {
                ...element.props,
                user: scopedUser,
              })
            : element;

          if (!effectiveReadOnly) {
            return scopedElement;
          }

          return (
            <Box>
              <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontWeight: 700 }}>
                View-only mode: edits are disabled for this page.
              </Typography>
              <Box
                sx={{
                  '& button, & input, & textarea, & select, & [role="button"], & [contenteditable="true"]': {
                    pointerEvents: 'none',
                  },
                  '& input, & textarea, & select': {
                    backgroundColor: 'action.hover',
                  },
                  '& .MuiButtonBase-root': {
                    opacity: 0.7,
                  },
                }}
              >
                {scopedElement}
              </Box>
            </Box>
          );
        })()
      : (
          <Navigate
            to="/access-denied"
            replace
            state={{ requiredFeature: featureKey, requiredPage: normalizePathname(pagePath), fromPath: location.pathname }}
          />
        );

  const currentChildren =
    (allowedCategories.find((c) => c.key === activeCategory)?.children || [])
      .filter((link) => canAccessPage(activeCategory, link.to));
  const activeCategoryLabel =
    allowedCategories.find((c) => c.key === activeCategory)?.label || 'Navigation';
  const showSideNav = Boolean(activeCategory);


  return (
      <div className="App">
        {user ? (
          <>
            {/* App header with logo, username and logout */}
            <Box
              component="header"
              className="app-top-header"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: { xs: 2, md: 3 },
                py: 1.5,
                bgcolor: '#102a43',
                color: '#f0f4f8',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <img src={logo} alt="Company logo" style={{ height: 36, borderRadius: 6 }} />
                <Chip
                  label="Social Development Fund"
                  sx={{
                    height: 30,
                    px: 0.5,
                    bgcolor: 'rgba(255,255,255,0.14)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.16)',
                    backdropFilter: 'blur(8px)',
                    '& .MuiChip-label': {
                      px: 0.9,
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    },
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FontAwesomeIcon icon={faUser} />
                <Typography variant="subtitle1" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                  Welcome {user?.username}
                </Typography>
              </Box>
              <Button
                color="inherit"
                startIcon={<FontAwesomeIcon icon={faSignOutAlt} />}
                onClick={handleLogout}
                sx={{ border: '1px solid rgba(255,255,255,0.22)', borderRadius: 2, px: 1.8 }}
              >
                Logout
              </Button>
            </Box>

            <header className="app-top-nav-wrap">
              <nav>
                <ul className="top-nav">
                  <li>
                    <button
                      className={activeCategory === null ? 'active' : undefined}
                      onClick={() => {
                        setActiveCategoryOverride(null);
                        navigate('/home');
                      }}
                    >
                      Home
                    </button>
                  </li>
                  {allowedCategories.map((cat) => (
                    <li key={cat.key}>
                      <button
                        className={
                          activeCategory === cat.key ? 'active' : undefined
                        }
                        onClick={() => setActiveCategoryOverride(cat.key)}
                      >
                        {cat.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </header>

            <div className="app-body">
              {showSideNav && (
                <aside className={`side-nav ${isSideNavCollapsed ? 'collapsed' : ''}`}>
                  <div className="side-nav-header">
                    <span className="side-nav-title">{activeCategoryLabel}</span>
                    <IconButton
                      className="side-nav-toggle"
                      onClick={() => setIsSideNavCollapsed((prev) => !prev)}
                      aria-label={isSideNavCollapsed ? 'Expand side navigation' : 'Collapse side navigation'}
                      title={isSideNavCollapsed ? 'Expand' : 'Collapse'}
                      size="small"
                    >
                      {isSideNavCollapsed ? <ChevronRightRoundedIcon fontSize="small" /> : <ChevronLeftRoundedIcon fontSize="small" />}
                    </IconButton>
                  </div>
                  <ul>
                    {currentChildren.map((link) => (
                      <li key={link.to}>
                        {(() => {
                          const LinkIcon = link.icon;

                          return (
                        <NavLink
                          to={link.to}
                          end={link.to === '/reporting'}
                          className={({ isActive }) => (isActive ? 'active' : '')}
                          title={link.label}
                          aria-label={link.label}
                        >
                          <span className="side-nav-link-content">
                            {LinkIcon ? (
                              <span className="side-nav-link-icon" aria-hidden="true">
                                <LinkIcon fontSize="small" />
                              </span>
                            ) : null}
                            {!isSideNavCollapsed ? (
                              <span className="side-nav-link-label">{link.label}</span>
                            ) : null}
                          </span>
                        </NavLink>
                          );
                        })()}
                      </li>
                    ))}
                  </ul>
                </aside>
              )}

              <main className="main-content">
                <Suspense fallback={pageLoader}>
                  <Routes>
                    <Route
                      path="/home"
                      element={
                        <Landing
                          onSelectCategory={setActiveCategoryOverride}
                          onLogout={handleLogout}
                          user={user}
                          allowedFeatures={allowedCategories.map((cat) => cat.key)}
                        />
                      }
                    />
                    <Route path="/access-denied" element={<AccessDenied />} />
                    <Route
                      path="/change-password"
                      element={<ChangePassword user={user} onPasswordChanged={handlePasswordChanged} onLogout={handleLogout} />}
                    />
                    <Route
                      path="/"
                      element={<Navigate to="/home" replace />}
                    />
                    <Route
                      path="/member/deposits"
                      element={renderWithAccess('member', <DepositManagement user={user} />)}
                    />
                    <Route
                      path="/member/account-enquiries"
                      element={renderWithAccess('member', <AccountEnquiries user={user} />)}
                    />
                    <Route
                      path="/member/withdrawal"
                      element={renderWithAccess('member', <Withdrawal />)}
                    />
                    <Route
                      path="/member/transfer"
                      element={renderWithAccess('member', <MemberTransfer user={user} />)}
                    />
                    <Route
                      path="/member/reprint"
                      element={renderWithAccess('member', <Reprint />)}
                    />
                    <Route
                      path="/member/customer-registration"
                      element={renderWithAccess('member', <CustomerRegistration />)}
                    />
                    <Route
                      path="/member/add-member-account"
                      element={renderWithAccess('member', <AddMemberAccount />)}
                    />
                    <Route
                      path="/member/member-activate"
                      element={renderWithAccess('member', <MemberActivate />)}
                    />
                    <Route
                      path="/member/member-close-account"
                      element={renderWithAccess('member', <MemberCloseAccount />)}
                    />
                    <Route
                      path="/member/member-activation"
                      element={renderWithAccess('member', <AccountActivation />)}
                    />
                    <Route
                      path="/member/member-close"
                      element={renderWithAccess('member', <MemberClose />)}
                    />
                    <Route
                      path="/member/member-payroll-management"
                      element={renderWithAccess('member', <MemberPayrollManagement />)}
                    />

                    <Route path="/loan/repayments" element={renderWithAccess('loan', <Repayments user={user} />)} />
                    <Route
                      path="/loan/change-off"
                      element={renderWithAccess('loan', <LoanChangeOff />)}
                    />
                    <Route
                      path="/loan/recovery"
                      element={renderWithAccess('loan', <RecoveryWriteOff />)}
                    />
                    <Route
                      path="/loan/reporting"
                      element={renderWithAccess('loan', <LoanReporting />)}
                    />
                    <Route
                      path="/loan/activate"
                      element={renderWithAccess('loan', <LoanActivate />)}
                    />
                    <Route
                      path="/loan/amortization"
                      element={renderWithAccess('loan', <LoanAmortization />)}
                    />
                    <Route
                      path="/loan/application"
                      element={renderWithAccess('loan', <LoanApplication />)}
                    />
                    <Route
                      path="/loan/approval"
                      element={renderWithAccess('loan', <LoanApproval />)}
                    />
                    <Route
                      path="/loan/disbursement"
                      element={renderWithAccess('loan', <LoanDisbursement />)}
                    />
                    <Route
                      path="/loan/guarantor"
                      element={renderWithAccess('loan', <LoanGuarantor />)}
                    />
                    <Route
                      path="/loan/application-reschedule"
                      element={renderWithAccess('loan', <LoanApplicationReschedule />)}
                    />
                    <Route
                      path="/loan/application-top-up"
                      element={renderWithAccess('loan', <LoanApplicationTopUp />)}
                    />

                    <Route
                      path="/accounting/periodic"
                      element={<Navigate to="/processing/subscription" replace />}
                    />
                    <Route
                      path="/accounting/cash-manager"
                      element={renderWithAccess('accounting', <CashManager />)}
                    />
                    <Route
                      path="/accounting/journals"
                      element={renderWithAccess('accounting', <Journals />)}
                    />
                    <Route
                      path="/accounting/transaction-update"
                      element={renderWithAccess('accounting', <TransactionUpdate />)}
                    />
                    <Route
                      path="/accounting/transaction-reversal-adjustment"
                      element={renderWithAccess('accounting', <TransactionReversalAdjustment />)}
                    />
                    <Route
                      path="/accounting/account-enquiry"
                      element={renderWithAccess('accounting', <AccountEnquiry />)}
                    />
                    <Route
                      path="/accounting/general-ledger"
                      element={renderWithAccess('accounting', <GeneralLedger />)}
                    />
                    <Route
                      path="/accounting/account-reconciliation"
                      element={renderWithAccess('accounting', <AccountReconciliation />)}
                    />
                    <Route
                      path="/accounting/periodic/subscription"
                      element={<Navigate to="/processing/subscription" replace />}
                    />
                    <Route
                      path="/accounting/periodic/interest"
                      element={<Navigate to="/processing/interest" replace />}
                    />
                    <Route
                      path="/accounting/periodic/period-dues"
                      element={<Navigate to="/processing/period-dues" replace />}
                    />
                    <Route
                      path="/processing"
                      element={<Navigate to="/processing/subscription" replace />}
                    />
                    <Route
                      path="/processing/subscription"
                      element={renderWithAccess('processing', <SubscriptionProcessing />)}
                    />
                    <Route
                      path="/processing/interest"
                      element={renderWithAccess('processing', <InterestCalculation />)}
                    />
                    <Route
                      path="/processing/period-dues"
                      element={renderWithAccess('processing', <PeriodDues />)}
                    />

                    <Route
                      path="/system/user-setup"
                      element={renderWithAccess('system', <UserSetup user={user} />)}
                    />
                    <Route
                      path="/system/access-control-groups"
                      element={renderWithAccess('system', <AccessControlGroups user={user} />)}
                    />
                    <Route
                      path="/system/security"
                      element={renderWithAccess('system', <UserSecurity />)}
                    />
                    <Route
                      path="/system/save-logs"
                      element={renderWithAccess('system', <SaveLogs />)}
                    />
                    <Route
                      path="/system/product"
                      element={renderWithAccess('system', <ProductDefinition />)}
                    />
                    <Route
                      path="/system/end-of-year"
                      element={renderWithAccess('system', <EndOfYear />)}
                    />
                    <Route
                      path="/system/running-balance-fix"
                      element={renderWithAccess('system', <RunningBalanceFix />)}
                    />

                    <Route path="/reporting" element={renderWithAccess('reporting', <Reporting />)} />
                    <Route
                      path="/reporting/analytics"
                      element={renderWithAccess('reporting', <ReportingAnalytics />)}
                    />

                    <Route path="*" element={<Navigate to="/home" replace />} />
                  </Routes>
                </Suspense>
              </main>
            </div>

            <Box
              component="footer"
              className="app-footer"
              sx={{
                px: { xs: 2, md: 3 },
                py: 1.5,
                bgcolor: '#102a43',
                color: '#c7d2df',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                © 2026 Microfinance Co. All rights reserved.
              </Typography>
            </Box>
          </>
        ) : (
          <Suspense fallback={pageLoader}>
            <Routes>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/*" element={<Login onLogin={handleLogin} />} />
            </Routes>
          </Suspense>
        )}
      </div>
  );
}

export default App;

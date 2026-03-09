import { cloneElement, isValidElement, lazy, Suspense, useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import logo from './assets/company-logo.jpg';
import './App.css';

// feature pages (lazy-loaded)
const DepositManagement = lazy(() => import('./features/member/DepositManagement'));
const MemberTransfer = lazy(() => import('./features/member/MemberTransfer'));
const Reprint = lazy(() => import('./features/member/Reprint'));

const Repayments = lazy(() => import('./features/loan/Repayments'));
const LoanChangeOff = lazy(() => import('./features/loan/LoanChangeOff'));
const RecoveryWriteOff = lazy(() => import('./features/loan/RecoveryWriteOff'));
const LoanReporting = lazy(() => import('./features/loan/Reporting'));

const SubscriptionProcessing = lazy(() => import('./features/accounting/PeriodicProcessing/SubscriptionProcessing'));
const InterestCalculation = lazy(() => import('./features/accounting/PeriodicProcessing/InterestCalculation'));

const UserSecurity = lazy(() => import('./features/system/UserSecurity'));
const UserSetup = lazy(() => import('./features/system/UserSetup'));
const AccessControlGroups = lazy(() => import('./features/system/AccessControlGroups'));
const AccessDenied = lazy(() => import('./features/system/AccessDenied'));
const ProductDefinition = lazy(() => import('./features/system/ModuleSetup/ProductDefinition'));

const Reporting = lazy(() => import('./features/reporting'));
const ReportingAnalytics = lazy(() => import('./features/reporting/Analytics'));
const Landing = lazy(() => import('./features/home/Landing'));
const Login = lazy(() => import('./features/auth/Login'));

const deriveCategoryFromPath = (pathname) => {
  const firstSegment = pathname.split('/').filter(Boolean)[0] || null;
  const allowedKeys = ['member', 'loan', 'accounting', 'system', 'reporting'];
  return allowedKeys.includes(firstSegment) ? firstSegment : null;
};

const normalizePermission = (permission) => {
  const value = String(permission || '').trim().toLowerCase();
  if (value === 'hide feature' || value === 'hide') {
    return 'hide';
  }
  if (value === 'view' || value === 'view only' || value === 'read') {
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

  // if user is logged in but on login path, send them home
  if (user && location.pathname === '/login') {
    return <Navigate to="/home" replace />;
  }

  const categories = [
    {
      key: 'member',
      label: 'Member Administration',
      children: [
        { label: 'Deposits', to: '/member/deposits' },
        { label: 'Member Transfer', to: '/member/transfer' },
        { label: 'Reprint', to: '/member/reprint' },
      ],
    },
    {
      key: 'loan',
      label: 'Loan Management',
      children: [
        { label: 'Repayments', to: '/loan/repayments' },
        { label: 'Loan Change off', to: '/loan/change-off' },
        { label: 'Recovery/Write-off', to: '/loan/recovery' },
        { label: 'Loan Reporting', to: '/loan/reporting' },
      ],
    },
    {
      key: 'accounting',
      label: 'Financial Accounting',
      children: [
        { label: 'Periodic Subscription Processing', to: '/accounting/periodic/subscription' },
        { label: 'Interest Calculation', to: '/accounting/periodic/interest' },
      ],
    },
    {
      key: 'system',
      label: 'System Administration',
      children: [
        { label: 'User Setup', to: '/system/user-setup' },
        { label: 'Access Control Groups', to: '/system/access-control-groups' },
        { label: 'Security', to: '/system/security' },
        { label: 'Product Setup', to: '/system/product' },
      ],
    },
    {
      key: 'reporting',
      label: 'Reporting & Analytics',
      children: [
        { label: 'Reporting', to: '/reporting' },
        { label: 'Analytics', to: '/reporting/analytics' },
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

    return 'hide';
  };

  const canAccessFeature = (featureKey) => getFeaturePermission(featureKey) !== 'hide';
  const isFeatureReadOnly = (featureKey) => getFeaturePermission(featureKey) === 'read';

  const allowedCategories = categories.filter((cat) => canAccessFeature(cat.key));

  const renderWithAccess = (featureKey, element) =>
    canAccessFeature(featureKey)
      ? (() => {
          const scopedUser = {
            ...user,
            access: {
              ...(user?.access || {}),
              readOnly: isFeatureReadOnly(featureKey),
              currentFeature: featureKey,
            },
          };

          const scopedElement = isValidElement(element)
            ? cloneElement(element, {
                ...element.props,
                user: scopedUser,
              })
            : element;

          if (!isFeatureReadOnly(featureKey)) {
            return scopedElement;
          }

          return (
            <Box>
              <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontWeight: 700 }}>
                View-only mode: edits are disabled for this feature.
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
            state={{ requiredFeature: featureKey, fromPath: location.pathname }}
          />
        );

  const currentChildren =
    allowedCategories.find((c) => c.key === activeCategory)?.children || [];
  const activeCategoryLabel =
    allowedCategories.find((c) => c.key === activeCategory)?.label || 'Navigation';
  const getCompactLabel = (label) =>
    label
      .split(/[\s/.-]+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  const showSideNav = Boolean(activeCategory);


  return (
      <div className="App">
        {user ? (
          <>
            {/* App header with logo, username and logout */}
            <Box
              component="header"
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
                <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>
                  Microfinance Management
                </Typography>
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

            <header>
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
                        <NavLink
                          to={link.to}
                          onClick={() => setActiveCategoryOverride(null)}
                          end={link.to === '/reporting'}
                          className={({ isActive }) => (isActive ? 'active' : '')}
                          title={link.label}
                        >
                          {isSideNavCollapsed ? getCompactLabel(link.label) : link.label}
                        </NavLink>
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
                      path="/"
                      element={<Navigate to="/home" replace />}
                    />
                    <Route
                      path="/member/deposits"
                      element={renderWithAccess('member', <DepositManagement user={user} />)}
                    />
                    <Route
                      path="/member/transfer"
                      element={renderWithAccess('member', <MemberTransfer user={user} />)}
                    />
                    <Route
                      path="/member/reprint"
                      element={renderWithAccess('member', <Reprint />)}
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
                      path="/accounting/periodic"
                      element={<Navigate to="/accounting/periodic/subscription" replace />}
                    />
                    <Route
                      path="/accounting/periodic/subscription"
                      element={renderWithAccess('accounting', <SubscriptionProcessing />)}
                    />
                    <Route
                      path="/accounting/periodic/interest"
                      element={renderWithAccess('accounting', <InterestCalculation />)}
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
                      path="/system/product"
                      element={renderWithAccess('system', <ProductDefinition />)}
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

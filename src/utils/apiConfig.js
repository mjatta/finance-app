/**
 * API Configuration for handling both dev (Vite middleware) and production
 * In development: Routes to local Vite middleware
 * In production: Routes to actual backend API
 */

// Determine if running in production (GitHub Pages)
const isProd = import.meta.env.PROD;
const API_BASE_URL = isProd 
  ? 'http://alakuyateh-001-site10.atempurl.com'  // Production backend
  : (import.meta.env.VITE_API_BASE_URL || '');    // Dev or env override

/**
 * Map of endpoint patterns to their dev and production paths
 * Dev endpoints use Vite middleware local routing
 * Prod endpoints use the actual backend paths
 */
const ENDPOINT_MAP = {
  // Cities, Branches, Countries - lookups
  cities: {
    dev: '/api/cities',
    prod: '/api/lookups/cities',
  },
  branches: {
    dev: '/api/branches',
    prod: '/api/lookups/branches',
  },
  countries: {
    dev: '/api/countries',
    prod: '/api/lookups/countries',
  },
  // User Setup
  'user-setup': {
    dev: '/api/user-setup',
    prod: '/api/user-setup',
  },
  'password-change': {
    dev: '/api/user-setup/password-change',
    prod: '/api/user-setup/password-change',
  },
  // Authentication
  'auth-login': {
    dev: '/api/auth/login',
    prod: '/api/auth/login',
  },
  // Member
  'member-create': {
    dev: '/api/member/create',
    prod: '/api/member/create',
  },
  'remote-member': {
    dev: '/api/remote-member',
    prod: '/api/member',
  },
  'member-details': {
    dev: '/api/remote-member/details',
    prod: '/api/member/details',
  },
  // Client
  'client-code': {
    dev: '/api/client/get-code',
    prod: '/api/client/get-code',
  },
  'client-lookup': {
    dev: '/api/client',
    prod: '/api/client',
  },
  // Corporate Group Member
  'corporate-member-create': {
    dev: '/api/corporategroupmember/create',
    prod: '/api/corporategroupmember/create',
  },
  // Deposits
  deposits: {
    dev: '/api/deposits',
    prod: '/api/deposits',
  },
  'deposits-search': {
    dev: '/api/Cusystem/GetShortDepositHistory',
    prod: '/api/Cusystem/GetShortDepositHistory',
  },
  // Security Settings
  'security-settings': {
    dev: '/api/security-settings',
    prod: '/api/security-settings',
  },
  // Product Definition
  'product-definition': {
    dev: '/api/product-definition',
    prod: '/api/product-definition',
  },
  // Periodic Processing
  'periodic-processing': {
    dev: '/api/periodic-processing',
    prod: '/api/periodic-processing',
  },
  // Banks
  banks: {
    dev: '/api/banks',
    prod: '/api/banks',
  },
  // Transactions
  transaction: {
    dev: '/api/transaction',
    prod: '/api/transaction',
  },
  // Dashboard
  'dashboard-summary': {
    dev: '/api/dashboard/summary',
    prod: '/api/dashboard/summary',
  },
  // Remote Cities
  'remote-cities': {
    dev: '/api/remote-cities/cities',
    prod: '/api/lookups/cities',
  },
  // Remote Countries
  'remote-countries': {
    dev: '/api/remote-countries/countries',
    prod: '/api/lookups/countries',
  },
  // Remote Branches
  'remote-branches': {
    dev: '/api/remote-branches/branches',
    prod: '/api/lookups/branches',
  },
  // Cusystem
  cusystem: {
    dev: '/api/Cusystem',
    prod: '/api/Cusystem',
  },
};

/**
 * Get the appropriate API endpoint URL based on environment
 * @param {string} endpointKey - Key from ENDPOINT_MAP
 * @returns {string} - Full URL to the endpoint
 */
export const getApiUrl = (endpointKey) => {
  const isDev = !API_BASE_URL;
  const endpoints = ENDPOINT_MAP[endpointKey];
  
  if (!endpoints) {
    console.warn(`Endpoint config not found for: ${endpointKey}`);
    return endpointKey; // fallback to raw key
  }
  
  const endpoint = isDev ? endpoints.dev : endpoints.prod;
  return API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
};

/**
 * Build a complete URL with query parameters
 * @param {string} endpointKey - Key from ENDPOINT_MAP
 * @param {Record<string, any>} params - Query parameters
 * @returns {string} - Complete URL with query string
 */
export const buildApiUrl = (endpointKey, params = {}) => {
  const baseUrl = getApiUrl(endpointKey);
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }
  
  const queryString = new URLSearchParams(params).toString();
  return `${baseUrl}?${queryString}`;
};

/**
 * Make a fetch request with automatic environment-based URL routing
 * @param {string} endpointKey - Key from ENDPOINT_MAP
 * @param {RequestInit} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>}
 */
export const apiFetch = async (endpointKey, options = {}) => {
  const url = getApiUrl(endpointKey);
  return fetch(url, options);
};

/**
 * CRITICAL: Get full API URL for ANY endpoint path
 * Use this for endpoints not in ENDPOINT_MAP
 * @param {string} path - The API path (e.g., '/api/remote-branches/branches')
 * @returns {string} - Full URL in production, relative path in dev
 */
export const getFullApiUrl = (path) => {
  if (isProd) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
};

export default {
  getApiUrl,
  buildApiUrl,
  apiFetch,
  getFullApiUrl,
  ENDPOINT_MAP,
};

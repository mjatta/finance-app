/**
 * Smart ID-to-Name lookup utility
 * Caches company, branch, and region lookups to resolve IDs to human-readable names
 * Usage: getBranchNameById(16) => "Branch Name"
 *        getCompanyNameById(30) => "Company Name"
 *        getRegionNameById(6) => "Region Name"
 */

let branchCache = {};
let companyCache = {};
let regionCache = {};
let branchCacheReady = false;
let regionCacheReady = false;
// Note: Company cache is NOT pre-populated; we fetch on-demand per CompId

/**
 * Fetch and cache branches by ID
 */
const initializeBranchCache = async () => {
  if (branchCacheReady) return;

  try {
    const url = '/api/lookups/branches';
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Failed to fetch branches for ID lookup cache:', res.status);
      return;
    }

    const branches = await res.json();
    if (Array.isArray(branches)) {
      branches.forEach((branch) => {
        // Try multiple field name variations
        const branchId = branch.id || branch.BranchId || branch.branchId || branch.br_id || branch.branchid;
        const branchName = branch.branchname || branch.BranchName || branch.branchName || branch.br_name || branch.branch || '';

        if (branchId) {
          branchCache[String(branchId)] = branchName.trim();
        }
      });
      branchCacheReady = true;
    }
  } catch (err) {
    console.warn('Error initializing branch cache:', err);
  }
};

/**
 * Fetch and cache regions by ID
 */
const initializeRegionCache = async () => {
  if (regionCacheReady) return;

  try {
    const url = '/api/lookups/counties';
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Failed to fetch regions for ID lookup cache:', res.status);
      return;
    }

    const regions = await res.json();
    if (Array.isArray(regions)) {
      regions.forEach((region) => {
        // Try multiple field name variations for ID
        const regionId = region.coun_id || region.id || region.CountyId || region.countyId || region.CountryId || region.countryId;
        // Try multiple field name variations for name
        const regionName = region.coun_name || region.name || region.CountyName || region.countyName || region.CountryName || region.countryName || '';

        if (regionId) {
          regionCache[String(regionId)] = regionName.trim();
        }
      });
      regionCacheReady = true;
    }
  } catch (err) {
    console.warn('Error initializing region cache:', err);
  }
};

/**
 * Fetch company name from API endpoint /api/lookups/creditunion/{compId}
 */
const fetchCompanyFromApi = async (compId) => {
  if (!compId) return '';

  try {
    const url = `/api/lookups/creditunion/${compId}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Company API] Failed to fetch company for CompId ${compId}:`, res.status);
      return '';
    }

    const data = await res.json();

    // Handle both object response and array response
    let company = data;
    if (Array.isArray(data) && data.length > 0) {
      company = data[0];
    }

    // Try multiple field name variations for company name
    const compName = company?.com_name || company?.ComName || company?.companyName || company?.CompanyName || company?.name || company?.Name || '';

    if (compName) {
      companyCache[String(compId)] = compName.trim();
      return compName.trim();
    }

    console.warn(`[Company API] No company name found in response for CompId ${compId}`);
    return '';
  } catch (err) {
    console.warn(`[Company API] Error fetching company for CompId ${compId}:`, err);
    return '';
  }
};

/**
 * Get branch name by ID
 * @param {number|string} branchId
 * @returns {string} Branch name or empty string if not found
 */
export const getBranchNameById = async (branchId) => {
  if (!branchId) return '';

  if (!branchCacheReady) {
    await initializeBranchCache();
  }

  const result = branchCache[String(branchId)] || '';
  return result;
};

/**
 * Get region name by ID
 * @param {number|string} regionId
 * @returns {string} Region name or empty string if not found
 */
export const getRegionNameById = async (regionId) => {
  if (!regionId) return '';

  if (!regionCacheReady) {
    await initializeRegionCache();
  }

  const result = regionCache[String(regionId)] || '';
  return result;
};

/**
 * Get company name by CompId
 * @param {number|string} compId
 * @returns {string} Company name or empty string if not found
 */
export const getCompanyNameById = async (compId) => {
  if (!compId) return '';

  // Check cache first
  const cached = companyCache[String(compId)];
  if (cached) {
    return cached;
  }

  // Fetch from API
  const result = await fetchCompanyFromApi(compId);
  return result;
};

/**
 * Synchronous version - returns cached value or empty string
 * (only works if cache has already been initialized)
 */
export const getBranchNameByIdSync = (branchId) => {
  if (!branchId) return '';
  return branchCache[String(branchId)] || '';
};

/**
 * Synchronous version - returns cached value or empty string
 * (only works if cache has already been initialized)
 */
export const getCompanyNameByIdSync = (compId) => {
  if (!compId) return '';
  return companyCache[String(compId)] || '';
};

/**
 * Pre-initialize caches on app startup
 */
export const initializeLookupCaches = async () => {
  // Initialize branch and region caches on startup
  // Company cache is fetched on-demand per CompId
  await initializeBranchCache();
  await initializeRegionCache();
};

/**
 * Clear caches (useful for testing or manual refresh)
 */
export const clearLookupCaches = () => {
  branchCache = {};
  companyCache = {};
  branchCacheReady = false;
};

export default {
  getBranchNameById,
  getCompanyNameById,
  getBranchNameByIdSync,
  getCompanyNameByIdSync,
  initializeLookupCaches,
  clearLookupCaches,
};

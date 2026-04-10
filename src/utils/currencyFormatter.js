/**
 * Format a number as currency with commas (Dalasi)
 * @param {string|number} value - The numeric value to format
 * @returns {string} - Formatted currency string with commas
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '';
  const numValue = String(value).replace(/,/g, '');
  if (isNaN(numValue)) return '';
  return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Remove currency formatting and return clean numeric value
 * @param {string} value - Formatted or unformatted numeric string
 * @returns {string} - Clean numeric value without commas
 */
export const unformatCurrency = (value) => {
  if (!value) return '';
  return String(value).replace(/,/g, '');
};

/**
 * Currency symbol for Dalasi (The Gambian currency)
 */
export const CURRENCY_SYMBOL = 'D';

/**
 * Validate if value is numeric, allowing decimal point
 * @param {string} value - The value to validate
 * @returns {string} - Clean numeric value
 */
export const cleanNumericInput = (value) => {
  // Remove non-numeric characters except decimal point
  const numericValue = value.replace(/[^0-9.]/g, '');
  // Remove multiple decimal points
  return numericValue.replace(/\.(?=.*\.)/g, '');
};

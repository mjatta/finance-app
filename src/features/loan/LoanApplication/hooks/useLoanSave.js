import { useState } from 'react';

export const useLoanSave = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveLoan = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/loans/LoanApplication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      // Try to parse response - handle various formats
      let result = {};
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          // Response is plain text or other format
          const text = await response.text();
          if (text) {
            result = { message: text, text: text, raw: text, statusCode: response.status };
          } else {
            // Empty response body - treat 200 as success
            result = { success: true, status: 'success', message: 'Loan application saved successfully', statusCode: response.status };
          }
        }
      } catch (parseErr) {
        console.error('Error parsing response:', parseErr);
        // If parsing fails but we got 200, treat as success
        result = { success: true, status: 'success', message: 'Loan application saved successfully', statusCode: response.status };
      }
      
      // Ensure result is always an object with statusCode for reference
      if (typeof result !== 'object' || result === null) {
        result = { message: String(result), statusCode: response.status };
      } else if (!result.statusCode) {
        result.statusCode = response.status;
      }
      
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to save loan application';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  return { saveLoan, loading, error };
};

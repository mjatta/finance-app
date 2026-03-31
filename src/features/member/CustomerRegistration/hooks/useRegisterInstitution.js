import { useState } from 'react';

/**
 * Custom hook to register an institution by calling the corporate group member API endpoint.
 * @returns {Object} { registerInstitution, loading, error, data }
 */
export function useRegisterInstitution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * Call the API to register an institution.
   * @param {Object} payload - The institution registration data (see API docs for structure).
   * @returns {Promise<Object>} The API response data.
   */
  const registerInstitution = async (payload) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await fetch('/api/corporategroupmember/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      let result = null;
      try {
        result = await response.json();
      } catch (jsonErr) {
        console.error('Failed to parse registerInstitution JSON:', jsonErr);
        result = {};
      }
      if (!response.ok) {
        setError((result && result.message) || `Failed to register institution (status ${response.status})`);
        setData(null);
        throw new Error((result && result.message) || 'Failed to register institution');
      }
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Unknown error');
      setData(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { registerInstitution, loading, error, data };
}

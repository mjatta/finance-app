import { useState } from 'react';
import { getFullApiUrl } from '../../../../utils/apiConfig';

export function useRegisterIndividual() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const registerIndividual = async (payload) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const url = getFullApiUrl('/api/member/create');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to register individual');
      }
      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { registerIndividual, loading, error, data };
}

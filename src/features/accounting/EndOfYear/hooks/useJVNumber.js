import { useState, useEffect } from 'react';

export const useJVNumber = () => {
  const [jvNumber, setJVNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchJVNumber = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/endofyear/jvnumber');
      if (!response.ok) throw new Error('Failed to fetch JV number');
      const data = await response.json();
      const number = data?.JVNo || data?.jvno || data || '';
      setJVNumber(number);
      return number;
    } catch (err) {
      setError(err.message);
      return '';
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJVNumber();
  }, []);

  return { jvNumber, loading, error, fetchJVNumber };
};

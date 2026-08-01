import { useQuery } from '@tanstack/react-query';

const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 hours

const getApiUrl = (endpoint) => endpoint;

export const useBanks = () => {
  return useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const endpoint = '/api/banks';
      const url = getApiUrl(endpoint);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch banks');
      const data = await response.json();
      return data.banks || [];
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    enabled: true,
  });
};

import { useQuery } from '@tanstack/react-query';

const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 hours

// Get API URL - handles both dev (Vite middleware) and production (backend API)
const getApiUrl = (endpoint) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  return baseUrl ? `${baseUrl}${endpoint}` : endpoint;
};

export const useCities = () => {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      // In dev: calls /api/cities (Vite middleware)
      // In prod: calls https://backend/api/lookups/cities
      const isDev = !import.meta.env.VITE_API_BASE_URL;
      const endpoint = isDev ? '/api/cities' : '/api/lookups/cities';
      const url = getApiUrl(endpoint);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch cities');
      const data = await response.json();
      return data.cities || [];
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    enabled: true,
  });
};

export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      // In dev: calls /api/branches (Vite middleware)
      // In prod: calls https://backend/api/lookups/branches
      const isDev = !import.meta.env.VITE_API_BASE_URL;
      const endpoint = isDev ? '/api/branches' : '/api/lookups/branches';
      const url = getApiUrl(endpoint);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch branches');
      const data = await response.json();
      return data.branches || [];
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    enabled: true,
  });
};

export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      // In dev: calls /api/countries (Vite middleware)
      // In prod: calls https://backend/api/lookups/countries
      const isDev = !import.meta.env.VITE_API_BASE_URL;
      const endpoint = isDev ? '/api/countries' : '/api/lookups/countries';
      const url = getApiUrl(endpoint);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch countries');
      const data = await response.json();
      return data.countries || [];
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    enabled: true,
  });
};

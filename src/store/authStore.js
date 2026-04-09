import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      companyDetails: null,

      setUser: (userData) => set({ user: userData }),

      setCompanyDetails: (details) => set({ companyDetails: details }),

      clearUser: () => set({ user: null, companyDetails: null }),
    }),
    {
      name: 'microfinance-auth',
    },
  ),
);

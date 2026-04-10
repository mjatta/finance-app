import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      companyDetails: null,
      loanProductDetails: null,
      loanProducts: [],

      setUser: (userData) => set({ user: userData }),

      setCompanyDetails: (details) => set({ companyDetails: details }),

      setLoanProducts: (products) => set({ loanProducts: products }),

      setLoanProductDetails: (details) => set({ loanProductDetails: details }),

      clearUser: () => set({ user: null, companyDetails: null, loanProductDetails: null, loanProducts: [] }),
    }),
    {
      name: 'microfinance-auth',
    },
  ),
);

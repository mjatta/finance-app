import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildApiUrl } from '../utils/apiConfig';

export const useUsersStore = create(
  persist(
    (set) => ({
      users: [],
      loading: false,
      error: null,
      lastFetched: null,

      /**
       * Fetch users list from the API after loans load successfully
       */
      fetchUsersList: async () => {
        set({ loading: true, error: null });

        try {
          const apiUrl = buildApiUrl('users-list', {});

          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
          }

          const payload = await response.json();
          console.log('Users List Response:', payload);

          // Handle if payload is directly an array
          let usersData = [];
          if (Array.isArray(payload)) {
            usersData = payload;
          } else if (payload && typeof payload === 'object') {
            // Check for success status with data wrapper
            if (payload.status === 'success' && payload.data) {
              usersData = Array.isArray(payload.data) ? payload.data : [payload.data];
            } else if (payload.data) {
              usersData = Array.isArray(payload.data) ? payload.data : [payload.data];
            }
          }

          set({
            users: usersData,
            loading: false,
            lastFetched: new Date().toISOString(),
          });

          return usersData;
        } catch (err) {
          console.error('Error fetching users list:', err);
          set({
            error: err.message || 'Failed to fetch users list',
            loading: false,
          });
          return [];
        }
      },

      /**
       * Clear users data when user logs off
       */
      clearUsers: () => set({
        users: [],
        loading: false,
        error: null,
        lastFetched: null,
      }),

      /**
       * Get users from store
       */
      getUsers: () => useUsersStore.getState().users,
    }),
    {
      name: 'microfinance-users',
    },
  ),
);

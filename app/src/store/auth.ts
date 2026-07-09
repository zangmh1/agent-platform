import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRead } from '../types'

interface AuthState {
  token: string | null
  user: UserRead | null
  setToken: (token: string) => void
  setUser: (user: UserRead) => void
  logout: () => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setToken: (token: string) => set({ token }),

      setUser: (user: UserRead) => set({ user }),

      logout: () => set({ token: null, user: null }),

      isLoggedIn: () => !!get().token,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)

import { create } from 'zustand'

interface AuthState {
  user: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (username, password) => {
    if (username === "Edoardo" && password === "12345") {
      set({ user: username, isAuthenticated: true })
    } else {
      alert("Credenziali non valide")
    }
  },
  logout: () => set({ user: null, isAuthenticated: false })
}))

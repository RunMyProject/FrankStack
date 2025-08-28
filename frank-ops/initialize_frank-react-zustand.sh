#!/bin/bash
# -----------------------------------------------------------------------------
# initialize_frank-react-zustand.sh
# -----------------------
# Script to initialize Zustand state management in FrankStack React project.
# Provides a simple demo login system:
# - Install Zustand
# - Create store directory and store file
# - Implement login/logout demo in Home.tsx using Zustand store
#
# Author: Edoardo Sabatini
# Date: 28 August 2025
# -----------------------------------------------------------------------------

echo "🚀 Starting Zustand setup + demo login"

# 1. Install Zustand
npm install zustand

# 2. Create store folder
mkdir -p src/store

# 3. Create useAuthStore.ts
cat > src/store/useAuthStore.ts <<EOL
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
      alert("Invalid credentials")
    }
  },
  logout: () => set({ user: null, isAuthenticated: false })
}))
EOL

echo "✅ Zustand store created in src/store/useAuthStore.ts"

# 4. Overwrite Home.tsx to use Zustand store
cat > src/pages/Home.tsx <<EOL
import { useAuthStore } from '../store/useAuthStore'
import Button from '../components/Button'
import ReactLogo from '../assets/react.svg'

export default function Home() {
  const { user, isAuthenticated, login, logout } = useAuthStore()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img src={ReactLogo} className="w-32 h-32 animate-spin" alt="React logo" />
      {!isAuthenticated ? (
        <>
          <h1 className="text-2xl font-bold mt-4">Login Demo</h1>
          <Button onClick={() => login('Edoardo', '12345')}>Login</Button>
        </>
      ) : (
        <>
          <h1 className="text-2xl text-green-600 mt-4">Hello {user}!</h1>
          <Button onClick={logout}>Logout</Button>
        </>
      )}
    </div>
  )
}
EOL

echo "✅ Home.tsx updated to use Zustand store"

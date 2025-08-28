#!/bin/bash
# -----------------------------------------------------------------------------
# initialize_frank-react-vite.sh
# -----------------------
# Script to initialize the FrankStack front-end project using:
# - React + TypeScript
# - Vite build tool
# - Tailwind CSS styling
# - React Router for SPA routing
#
# Sets up a ready-to-use development environment with:
# - Project folder structure
# - Base pages and components
# - Tailwind configuration
#
# Author: Edoardo Sabatini
# Date: 28 August 2025
# -----------------------------------------------------------------------------

set -e

echo "⚠️ During Vite project creation, choose 'React' as framework"
echo "and 'TypeScript + SWC' as variant"

echo "Creating FrankStack project..."

# 1. Create project folder
mkdir -p ~/Java/FrankStack
cd ~/Java/FrankStack

# 2. Create Vite project
npm create vite@latest frank-react-vite --yes
cd frank-react-vite

# 3. Install dependencies
npm install
npm install react-router-dom
npm install -D tailwindcss@3 postcss autoprefixer

# 4. Initialize Tailwind + PostCSS
npx tailwindcss init -p

# 5. Overwrite tailwind.config.js
cat > tailwind.config.js <<EOL
# Tailwind config
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOL

# 6. Base CSS
cat > src/index.css <<EOL
@tailwind base;
@tailwind components;
@tailwind utilities;
EOL

# 7. Create directories for pages and components
mkdir -p src/pages src/components

# 8. Create Home.tsx page
cat > src/pages/Home.tsx <<EOL
import ReactLogo from '../assets/react.svg'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img src={ReactLogo} className="w-32 h-32 animate-spin" alt="React logo" />
      <h1 className="text-4xl font-bold text-blue-600 mt-4">Welcome to FrankStack!</h1>
      <p className="mt-2 text-gray-700">React + TypeScript + Tailwind CSS + Vite</p>
    </div>
  )
}
EOL

# 9. Create Button.tsx component
cat > src/components/Button.tsx <<EOL
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
}

export default function Button({ children, onClick }: ButtonProps) {
  return (
    <button onClick={onClick} className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      {children}
    </button>
  )
}
EOL

# 10. Create App.tsx
cat > src/App.tsx <<EOL
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
EOL

# 11. Start development server
npm run dev

echo "✅ FrankStack setup completed. Visit http://localhost:5173/"

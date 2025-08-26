#!/bin/bash

# Script di inizializzazione FrankStack React + TypeScript + Vite + Tailwind CSS + React Router

set -e

echo "Attenzione: durante la creazione del progetto Vite scegli 'React' come framework"
echo "e 'TypeScript + SWC' come variante"

echo "Creazione progetto FrankStack..."

# 1. Creazione cartella progetto
mkdir -p ~/Java/FrankStack
cd ~/Java/FrankStack

# 2. Creazione progetto Vite
npm create vite@latest frank-react-vite --yes
cd frank-react-vite

# 3. Installazioni npm
npm install
npm install react-router-dom
npm install -D tailwindcss@3 postcss autoprefixer

# 4. Inizializzare Tailwind + PostCSS
npx tailwindcss init -p

# 5. Sovrascrivere tailwind.config.js
cat > tailwind.config.js <<EOL
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

# 6. CSS di base
cat > src/index.css <<EOL
@tailwind base;
@tailwind components;
@tailwind utilities;
EOL

# 7. Creare directories pages e components
mkdir -p src/pages src/components

# 8. Creare Home.tsx
cat > src/pages/Home.tsx <<EOL
import ReactLogo from '../assets/react.svg'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img src={ReactLogo} className="w-32 h-32 animate-spin" alt="React logo" />
      <h1 className="text-4xl font-bold text-blue-600 mt-4">Benvenuto in FrankStack!</h1>
      <p className="mt-2 text-gray-700">React + TypeScript + Tailwind CSS + Vite</p>
    </div>
  )
}
EOL

# 9. Creare Button.tsx
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

# 10. Creare App.tsx
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

# 11. Avvio dev server
npm run dev

echo "Setup FrankStack completato. Visita http://localhost:5173/"

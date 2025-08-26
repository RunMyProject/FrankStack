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

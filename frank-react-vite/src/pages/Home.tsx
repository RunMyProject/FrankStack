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
          <h1 className="text-2xl text-green-600 mt-4">Ciao {user}!</h1>
          <Button onClick={logout}>Logout</Button>
        </>
      )}
    </div>
  )
}

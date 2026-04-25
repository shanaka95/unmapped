import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))

function LoadingFallback() {
  return (
    <main className="flex-grow flex items-center justify-center min-h-screen">
      <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
        Loading...
      </span>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)

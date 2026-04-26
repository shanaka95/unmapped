import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '../api/auth'
import { getMe, logout as apiLogout } from '../api/auth'
import apiClient from '../api/client'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (user: User, accessToken: string) => void
  logout: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function refreshFromCookie(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    if (!response.ok) return null
    const body = await response.json()
    apiClient.setAccessToken(body.access_token)
    return body.access_token
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    async function restoreSession() {
      // Clear career path flags on every app load so users always start fresh
      localStorage.removeItem('career_path_shown')
      localStorage.removeItem('selected_occupation')

      const result = await getMe()
      if (result.data) {
        setState({ user: result.data, isAuthenticated: true, isLoading: false })
        return
      }

      const refreshed = await refreshFromCookie()
      if (refreshed) {
        const meResult = await getMe()
        if (meResult.data) {
          setState({ user: meResult.data, isAuthenticated: true, isLoading: false })
          return
        }
      }

      setState({ user: null, isAuthenticated: false, isLoading: false })
    }

    restoreSession()
  }, [])

  const login = useCallback((user: User, accessToken: string) => {
    apiClient.setAccessToken(accessToken)
    setState({ user, isAuthenticated: true, isLoading: false })
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }, [])

  const updateUser = useCallback((user: User) => {
    setState(prev => prev.user ? { ...prev, user } : prev)
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  loginUser,
  logoutUser,
  refreshSession,
  type LoginPayload,
  type RegisterPayload,
  registerUser,
} from '@/services/auth'
import { fetchCurrentUser } from '@/services/users'
import { getAccessToken, setAccessToken } from '@/services/api-client'
import type { UserProfile } from '@/types/api'
import { ApiClientError, NetworkError } from '@/types/api'

interface AuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  reloadUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      try {
        await refreshSession()
      } catch {
        setUser(null)
        return
      }
    }
    try {
      const profile = await fetchCurrentUser()
      setUser(profile)
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        setAccessToken(null)
      }
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true)
      try {
        await loadUser()
      } catch (error) {
        if (!(error instanceof NetworkError)) {
          setUser(null)
        }
      } finally {
        setIsLoading(false)
      }
    }
    void bootstrap()
  }, [loadUser])

  const login = useCallback(async (payload: LoginPayload) => {
    await loginUser(payload)
    const profile = await fetchCurrentUser()
    setUser(profile)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    await registerUser(payload)
    await loginUser({ email: payload.email, password: payload.password })
    const profile = await fetchCurrentUser()
    setUser(profile)
  }, [])

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      reloadUser: loadUser,
    }),
    [user, isLoading, login, register, logout, loadUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
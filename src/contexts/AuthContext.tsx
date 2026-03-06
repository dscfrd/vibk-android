import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import type { GoogleUser } from '../shared/cloud-types'
import { storage } from '../services/storage'

interface AuthContextValue {
  user: GoogleUser | null
  loading: boolean
  vaultPassword: string | null
  login: () => Promise<void>
  logout: () => Promise<void>
  setVaultPassword: (pw: string) => void
  getAccessToken: () => Promise<string>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  vaultPassword: null,
  login: async () => {},
  logout: async () => {},
  setVaultPassword: () => {},
  getAccessToken: async () => ''
})

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/drive.appdata'],
  webClientId: '' // Set from settings
})

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [vaultPassword, setVaultPw] = useState<string | null>(storage.getVaultPassword())

  useEffect(() => {
    // Check if already signed in
    const checkAuth = async (): Promise<void> => {
      try {
        const currentUser = await GoogleSignin.getCurrentUser()
        if (currentUser?.data) {
          setUser({
            email: currentUser.data.user.email,
            name: currentUser.data.user.name || '',
            picture: currentUser.data.user.photo || ''
          })
        }
      } catch { /* not signed in */ }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = useCallback(async () => {
    setLoading(true)
    try {
      await GoogleSignin.hasPlayServices()
      const result = await GoogleSignin.signIn()
      if (result.data) {
        setUser({
          email: result.data.user.email,
          name: result.data.user.name || '',
          picture: result.data.user.photo || ''
        })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await GoogleSignin.signOut()
    setUser(null)
    setVaultPw(null)
    storage.setVaultPassword(null)
  }, [])

  const setVaultPassword = useCallback((pw: string) => {
    setVaultPw(pw)
    storage.setVaultPassword(pw)
  }, [])

  const getAccessToken = useCallback(async (): Promise<string> => {
    const tokens = await GoogleSignin.getTokens()
    return tokens.accessToken
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, vaultPassword, login, logout, setVaultPassword, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

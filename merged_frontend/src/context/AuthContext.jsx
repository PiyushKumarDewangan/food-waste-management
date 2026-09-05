import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import authService from '../services/authService'
import { setAccessTokenGetter, setUnauthorizedHandler } from '../services/apiClient'

const AuthContext = createContext(null)

/**
 * Single source of truth for "who is logged in".
 *
 * The access token is kept ONLY in React state (via a ref, for apiClient to
 * read synchronously) — never in localStorage — to keep it out of reach of
 * XSS. The refresh token is an httpOnly cookie the frontend never touches
 * directly; see food-share-backend authController.js for how it's issued.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessTokenState] = useState(null)
  const [isLoading, setIsLoading] = useState(true) // true while we attempt silent session restore

  // apiClient is a plain module (no React), so it reads the current token
  // through a ref rather than a prop/closure that could go stale.
  const accessTokenRef = useRef(null)

  const setSession = useCallback((nextUser, nextAccessToken) => {
    accessTokenRef.current = nextAccessToken
    setAccessTokenState(nextAccessToken)
    setUser(nextUser)
  }, [])

  const clearSession = useCallback(() => {
    accessTokenRef.current = null
    setAccessTokenState(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setAccessTokenGetter(() => accessTokenRef.current)
  }, [])

  // Registers a handler apiClient calls whenever a request comes back 401.
  // It tries exactly one silent refresh + retry; if that also fails, the
  // session is cleared and the caller's original error propagates normally
  // (individual pages already show a "please log in" state on error).
  useEffect(() => {
    setUnauthorizedHandler(async (retryOriginalRequest) => {
      try {
        const result = await authService.refresh()
        setSession(result.data.user, result.data.accessToken)
        return retryOriginalRequest()
      } catch (err) {
        clearSession()
        throw err
      }
    })
  }, [setSession, clearSession])

  // On first load, silently attempt to restore a session from the httpOnly
  // refresh cookie (if the user previously checked "remember me" / has a
  // still-valid cookie from an earlier visit).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await authService.refresh()
        if (!cancelled) setSession(result.data.user, result.data.accessToken)
      } catch (err) {
        // No valid session — this is the normal "not logged in" case, not an error to surface.
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setSession, clearSession])

  const login = useCallback(
    async (identifier, password, rememberMe = false) => {
      const result = await authService.login({ identifier, password, rememberMe })
      setSession(result.data.user, result.data.accessToken)
      return result.data.user
    },
    [setSession]
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setSession, // exposed so register flows can log the user in immediately after signup (donor case)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export default AuthContext

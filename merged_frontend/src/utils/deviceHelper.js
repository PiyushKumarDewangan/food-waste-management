import { useState, useEffect } from 'react'

/**
 * Detects whether the current client is a mobile device using modern Client Hints
 * where available, falling back to comprehensive User Agent regex matching.
 * Safe for server rendering or test environments.
 */
export function isMobileDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  // 1. Modern User-Agent Client Hints API (Chromium-based mobile browsers)
  if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
    return navigator.userAgentData.mobile
  }

  // 2. Comprehensive User Agent Regex
  const ua = navigator.userAgent || navigator.vendor || window.opera || ''
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i
  if (mobileRegex.test(ua)) {
    return true
  }

  // 3. iPadOS Safari in desktop mode: reports Macintosh but has multi-touch
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) {
    return true
  }

  return false
}

/**
 * React hook that returns whether the current device is mobile.
 * Safely computes initial state and re-verifies on mount.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => isMobileDevice())

  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  return isMobile
}

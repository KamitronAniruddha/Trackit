'use client'

import { useEffect, useState } from 'react'

export const useIsMobile = (query: string = '(max-width: 768px)') => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query)
    // Set the initial state
    setIsMobile(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    // Add event listener
    mediaQuery.addEventListener('change', handler)

    // Cleanup on unmount
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [query])

  return isMobile
}

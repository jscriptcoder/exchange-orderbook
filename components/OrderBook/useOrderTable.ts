import { useCallback, useEffect, useState } from 'react'

export type TypeOrder = 'buy' | 'sell'

export default function useOrderTable(type: TypeOrder) {
  const [flipTable, setFlipTable] = useState(false)

  const mediaQueryListener = useCallback((event: MediaQueryListEvent) => {
    if (event.matches) {
      setFlipTable(true)
    } else {
      setFlipTable(false)
    }
  }, [setFlipTable])

  useEffect(() => {
    if (type === 'buy') { // ignore sell table
      const mediaQuery = global.matchMedia('(min-width: 768px)')

      // Initial check
      if (mediaQuery.matches) {
        setFlipTable(true)
      }
  
      mediaQuery.addEventListener('change', mediaQueryListener)
  
      return () => mediaQuery.removeEventListener('change', mediaQueryListener)
    }
  }, [type, mediaQueryListener])

  return flipTable
}
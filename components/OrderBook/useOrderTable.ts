import { useCallback, useEffect, useState } from 'react'

export type TypeOrder = 'buy' | 'sell'

export default function useOrderTable(type: TypeOrder): boolean {
  // This state variable will indicate where or not to flip the buy table.
  // This is needed to be able to properly display the tables in desktop
  // and small devices
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
      // We consider anything below 768px width to be a small device
      const mediaQuery = global.matchMedia('(min-width: 768px)')
      
      if (mediaQuery.matches) { // initial check
        setFlipTable(true)
      }
  
      mediaQuery.addEventListener('change', mediaQueryListener)
  
      return () => mediaQuery.removeEventListener('change', mediaQueryListener)
    }
  }, [type, mediaQueryListener])

  return flipTable
}
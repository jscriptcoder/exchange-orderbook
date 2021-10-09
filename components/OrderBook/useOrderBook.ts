import { useState, useCallback } from 'react'

import markets, { MarketInfo, Markets } from '../../utils/markets'

export default function useOrderBook() {
  const [ market, setMarket ] = useState<MarketInfo>(markets.PI_XBTUSD)

  const toggleFeedClick = useCallback(() => {
    if (market.name === Markets.PI_XBTUSD) {
      setMarket(markets.PI_ETHUSD)
    } else {
      setMarket(markets.PI_XBTUSD)
    }
  }, [market])

  const killFeedClick = useCallback(() => {}, [])

  return {
    market,
    toggleFeedClick,
    killFeedClick,
  }
}
import { useState, useCallback } from 'react'

import markets, { MarketInfo, Market } from '../../utils/markets'

export default function useOrderBook() {
  const [ market, setMarket ] = useState<MarketInfo>(markets.PI_XBTUSD)
  const [ isFeedKilled, killFeed ] = useState<boolean>(false)

  const toggleFeedClick = useCallback(() => {
    if (market.name === Market.PI_XBTUSD) {
      setMarket(markets.PI_ETHUSD)
    } else {
      setMarket(markets.PI_XBTUSD)
    }
  }, [market])

  const killFeedClick = useCallback(() => {
    killFeed(!isFeedKilled)
  }, [isFeedKilled])

  return {
    market,
    isFeedKilled,
    toggleFeedClick,
    killFeedClick,
  }
}
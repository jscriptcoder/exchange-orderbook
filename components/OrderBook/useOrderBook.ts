import {
  useState,
  useCallback,
  useEffect,
  useRef
} from 'react'
import debug from 'debug'
import markets, { Market, MarketInfo } from '../../utils/markets'
import { CommandType } from '../../utils/command'

const log = debug('app:useOrderBook')
const logerr = debug('app:useOrderBook:error')

export default function useOrderBook() {
  const [ market, setMarket ] = useState<MarketInfo>(markets.PI_XBTUSD)
  const [ orders, setOrders ] = useState(null)
  const [ isFeedKilled, killFeed ] = useState<boolean>(false)
  const orderProvider = useRef<Worker>()

  useEffect(() => {
    orderProvider.current = new Worker(new URL('./orderProvider.worker.ts', import.meta.url))
    
    orderProvider.current.addEventListener('message', (event: MessageEvent) => {
      log('[orderProvider.onmessage] Orders received from worker', event.data)
    })

    orderProvider.current.addEventListener('error', (err: ErrorEvent) => {
      logerr('[orderProvider.onerror] Error ocurred', err)
    })

    orderProvider.current.postMessage({
      type: CommandType.CONNECT,
      productId: market.name, // Subscribe right away to this market
    })

    return () => {
      if (orderProvider.current) {
        orderProvider.current.terminate()
      }
    }
  }, [])

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
    orders,
    isFeedKilled,
    toggleFeedClick,
    killFeedClick,
  }
}
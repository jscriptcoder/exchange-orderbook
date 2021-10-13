import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo
} from 'react'
import debug from 'debug'
import markets, { Market } from '../../utils/markets'
import OrderBookModel, { OrderBookModelUI } from './OrderBookModel'

const log = debug('app:useOrderBook')
const logerr = debug('app:useOrderBook:error')

export interface Orders {
  bids: number[][]
  asks: number[][]
}

export default function useOrderBook() {
  const [ isFeedKilled, killFeed ] = useState<boolean>(false)
  const workerRef = useRef<Worker>()
  const [ orderBook, setOrderBook ] = useState(new OrderBookModel(markets.PI_XBTUSD))
  const [ uiState, setUIState ] = useState<OrderBookModelUI>(orderBook.ui)

  useEffect(() => {
    workerRef.current = new Worker(new URL('./orderProvider.worker.ts', import.meta.url))
    orderBook.setWorker(workerRef.current)
    orderBook.on('uichange', () => setUIState(orderBook.ui))
    orderBook.connect()
    
    return () => orderBook.destroy()
  }, [])

  const spread = useMemo(() => orderBook.spread, [orderBook.spread])

  const groupSizeChange = useCallback((groupSize: number) => {
    orderBook.setUI({ groupSize })
  }, [orderBook])

  const toggleFeedClick = useCallback(() => {
    switch(orderBook.ui.market?.name) {
      case Market.PI_XBTUSD:
        orderBook.setUI({
          market: markets.PI_ETHUSD,
          groupSize: markets.PI_ETHUSD.sizes[0]
        })

        orderBook.unsubscribe(Market.PI_XBTUSD)
        break
      
      case Market.PI_ETHUSD:
        orderBook.setUI({
          market: markets.PI_XBTUSD,
          groupSize: markets.PI_XBTUSD.sizes[0]
        })

        orderBook.unsubscribe(Market.PI_ETHUSD)
        break
    }
  }, [orderBook])

  const killFeedClick = useCallback(() => {
    killFeed(!isFeedKilled)
  }, [isFeedKilled])

  return {
    ...uiState,
    spread,
    isFeedKilled,
    groupSizeChange,
    toggleFeedClick,
    killFeedClick,
  }
}
import {
  useState,
  useCallback,
  useEffect,
  useRef
} from 'react'
import debug from 'debug'
import markets, { Market, MarketInfo } from '../../utils/markets'
import { CommandType, ConnectCommand, SubscribeProduct } from '../../utils/command'
import { ClientEvent, ClientEventType, StapShot } from '../../utils/messageEvents'

const log = debug('app:useOrderBook')
const logerr = debug('app:useOrderBook:error')

export interface Orders {
  bids: number[][]
  asks: number[][]
}

export default function useOrderBook() {
  const [ state, setState ] = useState(ClientEventType.DISCONNECTED)
  const [ market, setMarket ] = useState<MarketInfo>(markets.PI_XBTUSD)
  const [ groupSize, setGroupSize ] = useState<number>(markets.PI_XBTUSD.sizes[0])
  const [ orders, setOrders ] = useState<Orders | null>(null)
  const [ isFeedKilled, killFeed ] = useState<boolean>(false)
  const orderProvider = useRef<Worker>()

  useEffect(() => {
    orderProvider.current = new Worker(new URL('./orderProvider.worker.ts', import.meta.url))
    
    orderProvider.current.addEventListener('message', (event: MessageEvent<ClientEvent>) => {
      const clientEvent: ClientEvent = event.data
      log('[orderProvider.onmessage] Message received from worker', event.data)

      if(orderProvider.current) {
        switch(clientEvent.event) {

          case ClientEventType.CONNECTED:
            setState(clientEvent.event)

            const cmd: SubscribeProduct = {
              type: CommandType.SUBSCRIBE,
              payload: { productId: market.name}
            }

            orderProvider.current.postMessage(cmd)
            break
          
          case ClientEventType.SUBSCRIBED:
          case ClientEventType.UNSUBSCRIBED:
          case ClientEventType.DISCONNECTED:
            setState(clientEvent.event)
            break
          
          case ClientEventType.SNAPSHOT:
            const snapshot = <StapShot>event.data
            setOrders({
              bids: snapshot.bids,
              asks: snapshot.asks,
            })
            break
          
          case ClientEventType.ORDERS:
        }
      }
    })

    orderProvider.current.addEventListener('error', (err: ErrorEvent) => {
      logerr('[orderProvider.onerror] Error ocurred', err)
    })

    const cmd: ConnectCommand = { type: CommandType.CONNECT }
    orderProvider.current.postMessage(cmd)

    return () => {
      if (orderProvider.current) {
        orderProvider.current.terminate()
      }
    }
  }, [])

  const groupSizeChange = useCallback((newGroupSize: number) => {
    setGroupSize(newGroupSize)
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
    groupSize,
    isFeedKilled,
    groupSizeChange,
    toggleFeedClick,
    killFeedClick,
  }
}
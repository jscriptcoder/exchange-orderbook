import debug from 'debug'
import EventEmitter from 'events'
import {
  CommandType,
  ConnectCommand,
  DisconnectCommand,
  ServerErrorCommand,
  SubscribeProduct,
  UnsubscribeProduct
} from '../../utils/command'
import { Market, MarketInfo } from '../../utils/markets'
import { ClientEvent, ClientEventType, ServiceEventType } from '../../utils/messageEvents'

const log = debug('app:OrderBookModel')
const logerr = debug('app:OrderBookModel:error')

export interface Orders {
  bids: number[][]
  asks: number[][]
}

type OptionalWorker = Worker | undefined
type OptionalMarket = Market | undefined

export interface OrderBookModelUI {
  state?: ClientEventType
  market?: MarketInfo 
  groupSize?: number
  orders?: Orders
}

export default class OrderBookModel extends EventEmitter {
  ui: OrderBookModelUI
  worker: OptionalWorker

  constructor(defaultMarket: MarketInfo) {
    super()

    this.ui = {
      state: ClientEventType.DISCONNECTED,
      market: defaultMarket,
      groupSize: defaultMarket.sizes[0],
    }
  }

  setWorker(worker: Worker): void {
    this.worker = worker
    this.worker.addEventListener('message', this._onMessage)
    this.worker.addEventListener('error', this._onError)
  }

  setUI(ui: OrderBookModelUI = {}): void {
    this.ui = {...this.ui, ...ui}
    this.emit('uichange', this.ui)
  }

  subscribe(productId: OptionalMarket = this.ui.market?.name): void {
    if (productId) {
      const subscribeCmd: SubscribeProduct = {
        type: CommandType.SUBSCRIBE,
        payload: { productId }
      }
  
      this.worker?.postMessage(subscribeCmd)
    }
  }

  unsubscribe(productId: OptionalMarket = this.ui.market?.name): void {
    if (productId) {
      const unsubscribeCmd: UnsubscribeProduct = {
        type: CommandType.UNSUBSCRIBE,
        payload: { productId }
      }
      this.worker?.postMessage(unsubscribeCmd)
    }
  }

  connect(): void {
    const connectCmd: ConnectCommand = { type: CommandType.CONNECT }
    this.worker?.postMessage(connectCmd)
  }

  disconnect(): void {
    const disconnectCmd: DisconnectCommand = { type: CommandType.DISCONNECT }
    this.worker?.postMessage(disconnectCmd)
  }

  get spread(): [number, number] | null {
    const { orders } = this.ui

    if (orders) {
      const midpoint: number = (orders.asks[0][0] + orders.bids[0][0]) / 2
      const diff: number = orders.asks[0][0] - orders.bids[0][0]
      const spread: number = (diff / midpoint) * 100
      return [diff, spread]
    }

    return null
  }

  private _onMessage = (event: MessageEvent<ClientEvent>): void => {
    const clientEvent: ClientEvent = event.data

        switch(clientEvent.event) {

          case ClientEventType.CONNECTED:
            log('Client connected')

            this.setUI(<OrderBookModelUI>{ typeState: clientEvent.event })

            // we automatically subscribe to the market by default
            this.subscribe()
            break
          
          case ClientEventType.SUBSCRIBED:
            log(`[orderProvider.message] Subscribed to ${clientEvent.product_id}`)
            this.setUI({ state: clientEvent.event })
            break
          
          case ClientEventType.UNSUBSCRIBED:
            log(`[orderProvider.message] Unsubscribed from ${clientEvent.product_id}`)
            this.setUI({ state: clientEvent.event })

            // if there is a market selected, then we automatycally subscribe to that one
            this.subscribe()
            break
          
          case ClientEventType.DISCONNECTED:
            log('[orderProvider.message] Client disconnected with message', clientEvent)
            // this.setUI({
            //   state: clientEvent.event,
            //   orders: undefined
            // })
            this.emit('clientdisconnect')
            break
          
          case ClientEventType.ERROR:
            const clientError: Event = clientEvent.error
            log('[orderProvider.message] Client error:', clientError)
            this.emit('clienterror', clientError)
            break
          
          case ClientEventType.SNAPSHOT:
            log('[orderProvider.message] Orders snapshot', clientEvent)
            this.setUI({
              orders: {
                bids: clientEvent.bids,
                asks: clientEvent.asks,
              }
            })
            break
          
          case ClientEventType.ORDERS:
            // log('[orderProvider.onmessage] Orders change', clientEvent)
            this.setUI({
              orders: {
                bids: clientEvent.bids,
                asks: clientEvent.asks,
              }
            })
            break
          
          case ServiceEventType.CLOSED:
            const closeCode: number = clientEvent.code
            log(`[orderProvider.message] Service closed with code ${closeCode}`)
            this.emit('serviceclosed', closeCode)
            break
          
          case ServiceEventType.ERROR:
            const serviceError: Error = clientEvent.error
            log('[orderProvider.message] Service error', serviceError)
            this.emit('servicerror', serviceError)
            break
        }
  }

  private _onError = (error: ErrorEvent): void => {
    logerr('Error ocurred', error)
    this.emit('error', error)
  }

  triggerServerError(): void {
    const serverErrorCmd: ServerErrorCommand = { type: CommandType.TRIGGERERROR }
    this.worker?.postMessage(serverErrorCmd)
  }

  destroy(): void {
    this.disconnect()

    if (this.worker) {
      this.worker.removeEventListener('message', this._onMessage)
      this.worker.removeEventListener('error', this._onError)
      this.worker.terminate()
    }
  }
}
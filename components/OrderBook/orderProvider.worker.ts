import {
  ClientCommand,
  CommandType,
  SubscribeProduct,
  UnsubscribeProduct
} from '../../utils/command'
import { orderBookProtocol } from '../../utils/config'
import {
  ClientConnected,
  ClientDisconnected,
  ClientEventType,
  OrdersChange,
  ClientSubscribed,
  ClientUnsubscribed,
  ServiceEvent,
  ServiceEventType,
  OrdersStapShot,
  TypeFeed,
} from '../../utils/messageEvents'

type Sort = 'asc' | 'desc'

interface SnapShot {
  numLevels: number,
  bids: number[][]
  asks: number[][]
}

let wsClient: WebSocket
let snapshot: SnapShot

export const processOrders = (orders: number[][], sort: Sort = 'asc', limit: number = 25): number[][] => (
  orders
    // make sure it's sorted (mutates original)
    .sort((order1: number[], order2: number[]) => (
      (order1[0] > order2[0] ? 1 : -1) * (sort === 'asc' ? 1 : -1)
    ))
    // calculate and add total size column (current size + accumulated)
    .reduce((acc: number[][], order: number[]) => {
      const totalSize = order[1] + (acc[acc.length-1] ? acc[acc.length-1][2] : 0)
      acc.push([...order, totalSize])
      return acc
    }, [])
    .slice(0, limit)
)

export const mergeChangesAndProcess = (changes: number[][], orders: number[][], sort: Sort = 'asc', limit: number = 25) => {
  changes.forEach((change: number[]) => {
    const orderIndex = orders.findIndex((order: number[]) => order[0] === change[0]) // same price level?

    if (orderIndex >= 0) {
      if (change[1] > 0) {
        orders[orderIndex][1] = change[1] // change the size (mutates original)
      } else {
        orders.splice(orderIndex, 1) // size is 0, delete the order (mutates original)
      }
    } else {
      change[1] > 0 && orders.push(change)
    }
  })
  
  return processOrders(orders, sort)

}

// [Websocket] Service to Worker
function onmessage(event: MessageEvent): void {
  const serviceEvent: ServiceEvent = JSON.parse(event.data)

  // [Worker API] Worker => UI
  switch (serviceEvent.event) {
    case ServiceEventType.INFO:
      console.log(`[wsClient.message] Client connected`)

      const connectedMsg: ClientConnected = {
        event: ClientEventType.CONNECTED
      }

      self.postMessage(connectedMsg)
      break

    case ServiceEventType.SUBSCRIBED:
      console.log(`[wsClient.message] Subscribed to ${serviceEvent.product_ids}`)

      const subscribedMsg: ClientSubscribed = {
        event: ClientEventType.SUBSCRIBED,
        product_id: serviceEvent.product_ids[0]
      }

      self.postMessage(subscribedMsg)
      break

    case ServiceEventType.UNSUBSCRIBED:
      console.log(`[wsClient.message] Unsubscribed from ${serviceEvent.product_ids}`)

      const unsubscribedMsg: ClientUnsubscribed = {
        event: ClientEventType.UNSUBSCRIBED,
        product_id: serviceEvent.product_ids[0]
      }

      self.postMessage(unsubscribedMsg)
      break

    default: // Orders are comming
      if (serviceEvent.feed === TypeFeed.BOOK_SNAPSHOT) {
        console.log(`[wsClient.message] Orders snapshot`)

        snapshot = {
          numLevels: serviceEvent.numLevels,
          bids: processOrders(serviceEvent.bids.slice(), 'desc', serviceEvent.numLevels),
          asks: processOrders(serviceEvent.asks.slice(), 'asc', serviceEvent.numLevels),
        }

        const snapShotMsg: OrdersStapShot = {
          event: ClientEventType.SNAPSHOT,
          ...snapshot,
        }

        self.postMessage(snapShotMsg)
      } else if (serviceEvent.feed === TypeFeed.BOOK) {
        // console.log(`[wsClientnmessage] Orders change`)

        const ordersMsg: OrdersChange = {
          event: ClientEventType.ORDERS,
          bids: mergeChangesAndProcess(serviceEvent.bids, snapshot.bids, 'desc', snapshot.numLevels),
          asks: mergeChangesAndProcess(serviceEvent.asks, snapshot.asks, 'asc', snapshot.numLevels),
        }

        self.postMessage(ordersMsg)
      } else {
        // TODO
      }
      
      break
  }
}

function onerror(err: Event): void {
  console.error('[wsClient.error] There was an error', err)
}

function onclose(event: CloseEvent): void {
  console.log('[websocket.onclose] Socket closed')

  const disconnecteddMsg: ClientDisconnected = {
    event: ClientEventType.DISCONNECTED
  }

  self.postMessage(disconnecteddMsg)
}

// [Worker API] UI => Worker
self.addEventListener('message', (event: MessageEvent<ClientCommand>) => {
  console.log('[orderBookWorker.message] Command received', event.data)

  const command: ClientCommand = event.data

  switch (command.type) {
    case CommandType.CONNECT:
      if (wsClient) {
        wsClient.close()
      }

      const port: number = parseInt(process.env.PORT || '3000', 10)

      console.log(`[orderBookWorker.message] Connecting to 'ws://0.0.0.0:${port}', protocol '${orderBookProtocol}'`)
      wsClient = new WebSocket(`ws://0.0.0.0:${port}`, orderBookProtocol)

      wsClient.addEventListener('message', onmessage)
      wsClient.addEventListener('error', onerror)
      wsClient.addEventListener('close', onclose)

      break

    case CommandType.SUBSCRIBE:
      if (wsClient) {
        const { productId } = command.payload

        const subscribeCmd: SubscribeProduct = {
          type: CommandType.SUBSCRIBE,
          payload: { productId }
        }

        console.log(`[orderBookWorker.message] Subscribing to ${productId}`)
        wsClient.send(JSON.stringify(subscribeCmd))
      }
      break
    
    case CommandType.UNSUBSCRIBE:
      if (wsClient) {
        const { productId } = command.payload

        const unsubscribeCmd: UnsubscribeProduct = {
          type: CommandType.UNSUBSCRIBE,
          payload: { productId }
        }

        console.log(`[orderBookWorker.message] Unsubscribing from ${productId}`)
        wsClient.send(JSON.stringify(unsubscribeCmd))
      }
      break
    
    case CommandType.DISCONNECT:
      wsClient.removeEventListener('message', onmessage)
      wsClient.removeEventListener('error', onerror)
      wsClient.removeEventListener('close', onclose)

      wsClient.close()
      break
  }
})
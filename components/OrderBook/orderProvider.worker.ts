import {
  ClientCommand,
  CommandType,
  SubscribeProduct,
  UnsubscribeProduct
} from '../../utils/command'
import { orderBookProtocol } from '../../utils/config'
import markets from '../../utils/markets'
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
  ClientError,
} from '../../utils/messageEvents'

interface CurrentOrders {
  numLevels: number,
  bids: number[][]
  asks: number[][]
}

interface InfoPriceLevel {
  price: number,
  size: number,
  total: number,
}

interface PriceLevels {
  [price: string]: InfoPriceLevel
}

type Sort = 'asc' | 'desc'

let wsClient: WebSocket
let currentOrders: CurrentOrders
let groupSize: number = markets.PI_XBTUSD.sizes[0]

function copyOrders(orders: number[][]): number[][] {
  return orders.map((order: number[]) => order.slice())
}

export function sortOrders(orders: number[][], sort: Sort): number[][] {
  return orders.sort((order1: number[], order2: number[]) => (
    (order1[0] > order2[0] ? 1 : -1) * (sort === 'asc' ? 1 : -1)
  ))
}

export const groupOrders = (orders: number[][], groupSize: number, sort: Sort): number[][] => {
  const priceLevels: PriceLevels = orders.reduce((acc: PriceLevels, order: number[]) => {
    const [price, size, total] = order
    const priceLevel: number = Math.floor(price / groupSize) * groupSize
    const strPriceLevel: string = `${priceLevel}`
    const infoPriceLevel: InfoPriceLevel = acc[strPriceLevel]

    acc[strPriceLevel] = infoPriceLevel
      ? {
        price: priceLevel,
        size: infoPriceLevel.size + size,
        total: infoPriceLevel.total + total
      }
      : {
        price: priceLevel,
        size,
        total,
      }

    return acc
  }, <PriceLevels>{})

  const groupedOrders =  Object
    .values(priceLevels)
    .map((infoPriceLevel: InfoPriceLevel) => {
      return [infoPriceLevel.price, infoPriceLevel.size, infoPriceLevel.total]
    })
  
  return sortOrders(groupedOrders, sort)
}

// Calculate and add total size column (current size + accumulated)
export function addTotal(orders: number[][]): number[][] {
  return orders.reduce((acc: number[][], order: number[]) => {
    const totalSize = order[1] + (acc[acc.length - 1] ? acc[acc.length - 1][2] : 0)
    acc.push([...order, totalSize])
    return acc
  }, [])
}

export function processOrders(orders: number[][], groupSize: number, sort: Sort, limit: number): number[][] {
  return groupOrders(addTotal(sortOrders(orders, sort)), groupSize, sort).slice(0, limit) // when the pipe operator??
}

export function updateOrders(changes: number[][], orders: number[][], sort: Sort): number[][] {
  changes.forEach((change: number[]) => {
    const orderIndex = orders.findIndex((order: number[]) => order[0] === change[0]) // same price level?

    if (orderIndex >= 0) {
      if (change[1] > 0) {
        orders[orderIndex][1] = change[1] // change the size
      } else {
        orders.splice(orderIndex, 1) // size is 0, delete the order
      }
    } else if (change[1] > 0) {
      orders.push(change)
    }
  })

  return sortOrders(orders, sort)
}

// [Websocket] Service to Worker
function onWSmessage(event: MessageEvent): void {
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

    case ServiceEventType.CLOSED:
      console.log(`[wsClient.message] Service closed with code ${serviceEvent.code}`)

      // Forward the message to the UI
      self.postMessage(serviceEvent)
      break

    case ServiceEventType.ERROR:
      console.log('[wsClient.message] Service error:', serviceEvent.error)

      // Forward the message to the UI
      self.postMessage(serviceEvent)
      break

    default: // Orders are comming
      if (serviceEvent.feed === TypeFeed.BOOK_SNAPSHOT) {
        console.log(`[wsClient.message] Orders snapshot`)

        // Will hold the current state of the orders
        currentOrders = {
          numLevels: serviceEvent.numLevels,
          bids: serviceEvent.bids,
          asks: serviceEvent.asks,
        }

        const snapShotMsg: OrdersStapShot = {
          event: ClientEventType.SNAPSHOT,
          numLevels: serviceEvent.numLevels,
          bids: processOrders(serviceEvent.bids, groupSize, 'desc', serviceEvent.numLevels),
          asks: processOrders(serviceEvent.asks, groupSize, 'asc', serviceEvent.numLevels),
        }

        self.postMessage(snapShotMsg)
      } else if (serviceEvent.feed === TypeFeed.BOOK) {
        // console.log(`[wsClientnmessage] Orders change`)

        // Update the orders bids and asks
        updateOrders(serviceEvent.bids, currentOrders.bids, 'desc')
        updateOrders(serviceEvent.asks, currentOrders.asks, 'asc')

        const ordersMsg: OrdersChange = {
          event: ClientEventType.ORDERS,
          bids: processOrders(copyOrders(currentOrders.bids), groupSize, 'desc', currentOrders.numLevels),
          asks: processOrders(copyOrders(currentOrders.asks), groupSize, 'asc', currentOrders.numLevels),
        }

        self.postMessage(ordersMsg)
      } else {
        // TODO
      }

      break
  }
}

function onWSerror(error: Event): void {
  console.error('[wsClient.error] There was an error:', error)

  const errorMsg: ClientError = {
    event: ClientEventType.ERROR,
    error,
  }

  self.postMessage(errorMsg)
}

function onWSclose(event: CloseEvent): void {
  console.log('[websocket.onclose] Socket closed')

  const disconnectedMsg: ClientDisconnected = {
    event: ClientEventType.DISCONNECTED
  }

  self.postMessage(disconnectedMsg)
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

      wsClient.addEventListener('message', onWSmessage)
      wsClient.addEventListener('error', onWSerror)
      wsClient.addEventListener('close', onWSclose)

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

    case CommandType.CHANGEGROUP:
      groupSize = command.payload.groupSize
      console.log(`[orderBookWorker.message] Setting groupSize to ${groupSize}`)
      break

    case CommandType.DISCONNECT:
      if (wsClient) {
        wsClient.removeEventListener('message', onWSmessage)
        wsClient.removeEventListener('error', onWSerror)
        wsClient.removeEventListener('close', onWSclose)

        wsClient.close()
      }
      break

    case CommandType.TRIGGERERROR:
      // Forward the command to the server, asking to trigger an error there
      wsClient?.send(JSON.stringify(command))
      break
  }
})
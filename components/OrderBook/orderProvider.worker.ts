import {
  ClientCommand,
  CommandType,
  ServiceCommand,
} from '../../utils/command'
import { defaultGroupSize, orderBookProtocol, wsUrl } from '../../utils/config'
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
import { copyOrders, processOrders, updateOrders } from './workerHelpers'

interface CurrentOrders {
  numLevels: number,
  bids: number[][]
  asks: number[][]
}

let wsClient: WebSocket
let currentOrders: CurrentOrders
let groupSize: number = defaultGroupSize

// [Websocket] Service => Worker
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

      console.log(`[orderBookWorker.message] Connecting to '${wsUrl}', protocol '${orderBookProtocol}'`)
      // wsClient = new WebSocket(wsUrl, orderBookProtocol)
      wsClient = new WebSocket(wsUrl)

      wsClient.addEventListener('message', onWSmessage)
      wsClient.addEventListener('error', onWSerror)
      wsClient.addEventListener('close', onWSclose)

      break

    case CommandType.SUBSCRIBE:
      if (wsClient) {
        const { productId } = command.payload

        // [DEPRECATED]
        // const subscribeCmd: SubscribeProduct = {
        //   type: CommandType.SUBSCRIBE,
        //   payload: { productId }
        // }

        const subscribeCmd: ServiceCommand = {
          event: CommandType.SUBSCRIBE,
          feed: TypeFeed.BOOK,
          product_ids: [productId],
        }

        console.log(`[orderBookWorker.message] Subscribing to ${productId}`)
        wsClient.send(JSON.stringify(subscribeCmd))
      }
      break

    case CommandType.UNSUBSCRIBE:
      if (wsClient) {
        const { productId } = command.payload

        // [DEPRECATED]
        // const unsubscribeCmd: UnsubscribeProduct = {
        //   type: CommandType.UNSUBSCRIBE,
        //   payload: { productId }
        // }

        const unsubscribeCmd: ServiceCommand = {
          event: CommandType.UNSUBSCRIBE,
          feed: TypeFeed.BOOK,
          product_ids: [productId],
        }

        console.log(`[orderBookWorker.message] Unsubscribing from ${productId}`)
        wsClient.send(JSON.stringify(unsubscribeCmd))
      }
      break

    case CommandType.CHANGEGROUP:
      // The worker will need this to perform some computation and group the orders
      // as per market tick size
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
      // wsClient?.send(JSON.stringify(command)) // [DEPRECATED]

      // Let's just close the connection
      wsClient?.close()
      break
  }
})
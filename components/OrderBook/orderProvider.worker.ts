import { ClientCommand, CommandType, ServiceCommand, ConnectCommand, SubscribeProduct, UnsubscribeProduct } from '../../utils/command'
import { orderBookProtocol } from '../../utils/config'
import { ClientConnected, ClientEventType, ClientOrders, ClientSubscribed, ClientUnsubscribed, ServiceEvent, ServiceEventType, StapShot, TypeFeed } from '../../utils/messageEvents'

let wsClient: WebSocket

function onmessage(event: MessageEvent) {
  const serviceEvent: ServiceEvent = JSON.parse(event.data)
  console.log('[websocket.onmessage] Event received from service', serviceEvent)

  switch (serviceEvent.event) {
    case ServiceEventType.INFO:
      console.log(`[websocket.onmessage] Client connected`)

      const connectedMsg: ClientConnected = {
        event: ClientEventType.CONNECTED
      }

      self.postMessage(connectedMsg)
      break

    case ServiceEventType.SUBSCRIBED:
      console.log(`[websocket.onmessage] Subscribed to ${serviceEvent.product_ids}`)

      const subscribedMsg: ClientSubscribed = {
        event: ClientEventType.SUBSCRIBED,
        product_id: serviceEvent.product_ids[0]
      }

      self.postMessage(subscribedMsg)
      break

    case ServiceEventType.UNSUBSCRIBED:
      console.log(`[websocket.onmessage] Unsubscribed from ${serviceEvent.product_ids}`)

      const unsubscribedMsg: ClientUnsubscribed = {
        event: ClientEventType.UNSUBSCRIBED,
        product_id: serviceEvent.product_ids[0]
      }

      self.postMessage(unsubscribedMsg)
      break

    default: // Orders are comming
      if (serviceEvent.feed === TypeFeed.BOOK_SNAPSHOT) {
        console.log(`[websocket.onmessage] Orders snapshot`)

        const snapShotMsg: StapShot = {
          event: ClientEventType.SNAPSHOT,
          numLevels: serviceEvent.numLevels,
          bids: serviceEvent.bids,
          asks: serviceEvent.asks,
        }

        self.postMessage(snapShotMsg)
      } else {
        console.log(`[websocket.onmessage] Incomming orders`)

        const ordersMsg: ClientOrders = {
          event: ClientEventType.ORDERS,
          bids: serviceEvent.bids,
          asks: serviceEvent.asks,
        }

        self.postMessage(ordersMsg)
      }
      
      break
  }
}

function onerror(err: Event) {
  console.error('[websocket.onerror] There was an error', err)
}

function onclose(event: CloseEvent) {
  console.log('[websocket.onclose] Socket closed')
}

self.addEventListener('message', (event: MessageEvent<ClientCommand>) => {
  console.log('[worker.onmessage] Command received', event.data)

  const command: ClientCommand = event.data

  switch (command.type) {
    case CommandType.CONNECT:
      if (wsClient) {
        wsClient.close()
      }

      const port: number = parseInt(process.env.PORT || '3000', 10)

      console.log(`[worker.onmessage] Connecting to 'ws://0.0.0.0:${port}', protocol '${orderBookProtocol}'`)
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

        console.log(`[worker.onmessage] Subscribing to ${productId}`)
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

        console.log(`[worker.onmessage] Unsubscribing from ${productId}`)
        wsClient.send(JSON.stringify(unsubscribeCmd))
      }
      break
  }
})
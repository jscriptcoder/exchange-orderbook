import { ClientCommand, CommandType, ServiceCommand, ConnectCommand } from '../../utils/command'
import { orderBookProtocol } from '../../utils/config'
import { ServiceEvent, ServiceEventType, ServiceInfo } from '../../utils/socketEvents'

type ConnectPayload = ConnectCommand['payload']

let wsClient: WebSocket

function onmessage (event: MessageEvent<ServiceEvent>, cmdPayload: {[key: string]: any}) {
  const serviceEvent: ServiceEvent = event.data
  console.log('[websocket.onmessage] Event received from service', serviceEvent)

  switch(serviceEvent.event) {
    case ServiceEventType.INFO:
      const { productId } = <ConnectPayload>cmdPayload

      console.log(`[websocket.onmessage] Subscribing to ${productId}`)

      const subscribeCommand: ServiceCommand = {
        event: CommandType.SUBSCRIBE,
        feed: 'book_ui_1',
        product_ids: [productId],
      }

      wsClient.send(JSON.stringify(subscribeCommand))
      break
    
    case ServiceEventType.SUBSCRIBED:
      console.log(`[websocket.onmessage] Subscribed to ${serviceEvent.product_ids}`)
      break
    
    case ServiceEventType.UNSUBSCRIBED:
      console.log(`[websocket.onmessage] Unsubscribed from ${serviceEvent.product_ids}`)
      break
    
    default: // Orders are comming
      // TODO
  }
}

self.addEventListener('message', (event: MessageEvent<ClientCommand>) => {
  console.log('[worker.onmessage] Command received', event.data)

  const command: ClientCommand = event.data
  const { payload } = command

  switch(command.type) {
    case CommandType.CONNECT:
      const port: number = parseInt(process.env.PORT || '3000', 10)

      console.log(`Connecting to 'ws://0.0.0.0:${port}', protocol '${orderBookProtocol}'`)
      wsClient = new WebSocket(`ws://0.0.0.0:${port}`, orderBookProtocol)

      wsClient.addEventListener('message', (event: MessageEvent) => {
        onmessage(event, payload)
      })

      wsClient.addEventListener('error', (err: Event) => {
        console.error('[websocket.onerror] There was an error', err)
      })

      wsClient.addEventListener('close', (event: CloseEvent) => {
        console.log('[websocket.onclose] Socket closed')
      })

      break
  }
})
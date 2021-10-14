import {
  client as WebSocketClient,
  server as WebSocketServer,
  connection,
  Message,
  request,
} from 'websocket'
import { Server } from 'http'
import debug from 'debug'
import Deferred from './Deferred'
import { orderBookProtocol } from '../utils/config'
import { ClientCommand, CommandType, ServiceCommand } from '../utils/command'
import { Market } from '../utils/markets'
import { ServiceClosed, ServiceError, ServiceEventType, TypeFeed } from '../utils/messageEvents'

const log = debug('app:wsProxy')
const logerr = debug('app:wsProxy:error')

// [Websocket] Proxy => Service
function sendCommandToService(event: CommandType, productId: Market, service: connection): void {
  log(`[sendCommandToService] Sending event '${event}' with product '${productId}'`)
  const command: ServiceCommand = {
    event,
    feed: TypeFeed.BOOK,
    product_ids: [productId],
  }
  const sendData: string = JSON.stringify(command)
  service.sendUTF(sendData)
}

// [Websocket] Client => Proxy
function onClientMessage(command: ClientCommand, service: connection, client?: connection): void {

  switch(command.type) {
    case CommandType.SUBSCRIBE:
      sendCommandToService(CommandType.SUBSCRIBE, command.payload.productId, service)
      break
    
    case CommandType.UNSUBSCRIBE:
      sendCommandToService(CommandType.UNSUBSCRIBE, command.payload.productId, service)
      break
    
    case CommandType.TRIGGERERROR:
      // service.close(1011) // Server error. See https://github.com/Luka967/websocket-close-codes
      client?.close(1011)
      break
  }
}

async function connectToService(wsApi: string): Promise<connection> {
  log(`[connectToService] Connecting to ${wsApi}...`)

  const wsServiceClient = new WebSocketClient()
  const deferredConnection = new Deferred<connection>()

  wsServiceClient.on('connect', (connection: connection) => {
    log(`[wsServiceClient.connect] Connection to ${wsApi} established`)
    deferredConnection.resolve(connection)
  })

  wsServiceClient.on('connectFailed', (error: Error) => {
    logerr(`[wsServiceClient.connectFailed] Connection to ${wsApi} failed. Error`, error)
    deferredConnection.reject(error)
  })

  wsServiceClient.connect(wsApi)

  return deferredConnection.promise
}

async function onWSrequest(request: request) {
  const clientConnection: connection = request.accept(orderBookProtocol, request.origin)
  
  log(`[onrequest] Client ${clientConnection.remoteAddress} connected`)

  const serviceConnection: connection = await connectToService('wss://www.cryptofacilities.com/ws/v1')

  // [Websocket} Client => Proxy
  clientConnection.on('message', (data: Message) => {
    log('[clientConnection.message] Client message received', data)

    if (data.type === 'utf8') {
      const command: ClientCommand = JSON.parse(data.utf8Data)
      log(`Command received`, command)
      onClientMessage(command, serviceConnection, clientConnection)
    }
  })

  clientConnection.on('close', (code: number) => {
    log(`[clientConnection.close] Client ${clientConnection.remoteAddress} disconnected with code ${code}`)

    // If the client closes, we also close the service connection
    serviceConnection.close()
  })

  clientConnection.on('error', (error: Error) => {
    log('[clientConnection.error] Client error', error)

    // If the client crashes, we close the service connection
    // serviceConnection.close()
  })

  // [Websocket] Service => Proxy => Client (Browser)
  serviceConnection.on('message', (data: Message) => {
    // log('[serviceConnection.message] Service message received', data)

    if (data.type === 'utf8') {
      // Forwarding the data comming from the service (cryptofacilities) to the client (browser)
      clientConnection.sendUTF(data.utf8Data)
    }
  })

  serviceConnection.on('close', (code: number) => {
    log(`[serviceConnection.close] Service closed`)

    // Notify the client the service connection has closed
    const closedMessage: ServiceClosed = {
      event: ServiceEventType.CLOSED,
      code
    }

    clientConnection.sendUTF(JSON.stringify(closedMessage))
  })

  serviceConnection.on('error', (error: Error) => {
    log('[serviceConnection.error] Service error', error)

    // Notify the client there was an error with the service
    const errorMessage: ServiceError = {
      event: ServiceEventType.ERROR,
      error
    }

    clientConnection.sendUTF(JSON.stringify(errorMessage))
  })
}

export function start(httpServer: Server) {
  const server = new WebSocketServer({ httpServer })
  server.on('request', onWSrequest)
}
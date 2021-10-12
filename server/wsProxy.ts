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
import { TypeFeed } from '../utils/messageEvents'

const log = debug('app:wsProxy')
const logerr = debug('app:wsProxy:error')

function sendCommandToService(event: CommandType, productId: Market, service: connection) {
  log(`Sending event '${event}' with product '${productId}'`)
  const command: ServiceCommand = {
    event,
    feed: TypeFeed.BOOK,
    product_ids: [productId],
  }
  const sendData: string = JSON.stringify(command)
  service.sendUTF(sendData)
}

function onmessage(command: ClientCommand, service: connection) {

  switch(command.type) {
    case CommandType.SUBSCRIBE:
      sendCommandToService(CommandType.SUBSCRIBE, command.payload.productId, service)
      break
    
    case CommandType.UNSUBSCRIBE:
      sendCommandToService(CommandType.UNSUBSCRIBE, command.payload.productId, service)
      break
  }
}

async function connect2Service(wsApi: string): Promise<connection> {
  log(`Connecting to ${wsApi}...`)

  const wsServiceClient = new WebSocketClient()
  const deferredConnection = new Deferred<connection>()

  wsServiceClient.on('connect', (connection: connection) => {
    log(`Connection to ${wsApi} established`)
    deferredConnection.resolve(connection)
  })

  wsServiceClient.on('connectFailed', (err: Error) => {
    logerr(`Connection to ${wsApi} failed. Error`,err)
    deferredConnection.reject(err)
  })

  wsServiceClient.connect(wsApi)

  return deferredConnection.promise
}

async function onrequest(request: request) {
  const clientConnection: connection = request.accept(orderBookProtocol, request.origin)
  
  log(`Client ${clientConnection.remoteAddress} connected`)

  const serviceConnection: connection = await connect2Service('wss://www.cryptofacilities.com/ws/v1')

  clientConnection.on('close', (code: number) => {
    log(`Client ${clientConnection.remoteAddress} disconnected with code ${code}`)
    serviceConnection.close()
  })

  clientConnection.on('message', (data: Message) => {
    log('Client message received', data)

    if (data.type === 'utf8') {
      const command: ClientCommand = JSON.parse(data.utf8Data)
      log(`Command received`, command)
      onmessage(command, serviceConnection)
    }
  })

  serviceConnection.on('message', (data: Message) => {
    log('Service message received', data)

    if (data.type === 'utf8') {
      // Forwarding the data comming from the service (cryptofacilities) to the client (browser)
      clientConnection.sendUTF(data.utf8Data)
    }
  })
}

export function start(httpServer: Server) {
  const server = new WebSocketServer({ httpServer })
  server.on('request', onrequest)
}
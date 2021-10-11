import {
  client as WebSocketClient,
  server as WebSocketServer,
  connection,
  IUtf8Message,
  Message,
  request,
} from 'websocket'
import { Server } from 'http'
import debug from 'debug'
import Deferred from './Deferred'

const log = debug('app:wsProx')
const logerr = debug('app:wsProx:error')

interface ClientCommand {
  type: string
  payload: {[key: string]: string}
}

interface ServiceCommand {
  event: string
  feed: string,
  product_ids: string[],
}

function sendCommandToService(event: string, productId: string, service: connection) {
  log(`Sending event '${event}' with product '${productId}'`)
  const command: ServiceCommand = {
    event,
    feed: 'book_ui_1',
    product_ids: [productId],
  }
  const sendData: string = JSON.stringify(command)
  service.sendUTF(sendData)
}

function onmessage(command: ClientCommand, service: connection) {
  const { payload } = command

  switch(command.type) {
    case 'change-product':
      sendCommandToService('unsubscribe', payload.oldProductId, service)
      sendCommandToService('subscribe', payload.newProductId, service)
      break
    // TODO: more commands
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
  const clientConnection: connection = request.accept('order-book', request.origin)
  
  log(`Client ${clientConnection} connected`)

  const serviceConnection: connection = await connect2Service('wss://www.cryptofacilities.com/ws/v1')

  clientConnection.on('close', (code: number, desc: string) => {
    log(`Client ${clientConnection} disconnected with code ${code}`)
    serviceConnection.close(code)
  })

  clientConnection.on('message', (data: Message) => {
    const command: ClientCommand = JSON.parse((<IUtf8Message>data).utf8Data)
    log(`Command received`, command)
    onmessage(command, serviceConnection)
  })
}

export function start(httpServer: Server) {
  const server = new WebSocketServer({ httpServer })
  server.on('request', onrequest)
}
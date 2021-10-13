import { Market } from './markets'
import { TypeFeed } from './messageEvents'

export enum CommandType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
}

export interface ConnectCommand {
  type: CommandType.CONNECT
}

export interface DisconnectCommand {
  type: CommandType.DISCONNECT
}

export interface SubscribeProduct {
  type: CommandType.SUBSCRIBE
  payload: {
    productId: Market
  }
}

export interface UnsubscribeProduct {
  type: CommandType.UNSUBSCRIBE
  payload: {
    productId: Market
  }
}

export type ClientCommand 
  = ConnectCommand 
  | DisconnectCommand 
  | SubscribeProduct 
  | UnsubscribeProduct

export interface ServiceCommand {
  event: CommandType
  feed: TypeFeed
  product_ids: Market[]
}
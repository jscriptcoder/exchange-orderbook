import { Market } from './markets'

export enum ServiceEventType {
  INFO = 'info',
  SUBSCRIBED = 'subscribed',
  UNSUBSCRIBED = 'unsubscribed',
  CLOSED = 'closed',
  ERROR = 'error',
}

export enum TypeFeed {
  BOOK = 'book_ui_1',
  BOOK_SNAPSHOT = 'book_ui_1_snapshot',
}

export interface ServiceInfo {
  event: ServiceEventType.INFO
  version: number
}

export interface ServiceSubscribed {
  event: ServiceEventType.SUBSCRIBED
  feed: TypeFeed.BOOK,
  product_ids: Market[]
}

export interface ServiceUnsubscribed {
  event: ServiceEventType.UNSUBSCRIBED
  feed: TypeFeed.BOOK,
  product_ids: Market[]
}

export interface ServiceSnapshot {
  event: undefined
  numLevels: number
  feed: TypeFeed.BOOK_SNAPSHOT
  bids: number[][]
  asks: number[][]
  product_id: Market
}

export interface ServiceOrders {
  event: undefined
  feed: TypeFeed.BOOK
  product_id: Market
  bids: number[][]
  asks: number[][]
}

export interface ServiceClosed {
  event: ServiceEventType.CLOSED
  code: number,
}

export interface ServiceError {
  event: ServiceEventType.ERROR
  error: Error,
}

export type ServiceEvent 
  = ServiceInfo 
  | ServiceSubscribed 
  | ServiceUnsubscribed 
  | ServiceSnapshot 
  | ServiceOrders
  | ServiceClosed
  | ServiceError

export enum ClientEventType {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  SUBSCRIBED = 'subscribed',
  UNSUBSCRIBED = 'unsubscribed',
  SNAPSHOT = 'snapshot',
  ORDERS = 'orders',
  ERROR = 'error',
}

export interface ClientConnected {
  event: ClientEventType.CONNECTED
}

export interface ClientDisconnected {
  event: ClientEventType.DISCONNECTED
}

export interface ClientSubscribed {
  event: ClientEventType.SUBSCRIBED
  product_id: Market
}

export interface ClientUnsubscribed {
  event: ClientEventType.UNSUBSCRIBED
  product_id: Market
}

export interface OrdersStapShot {
  event: ClientEventType.SNAPSHOT
  numLevels: number
  bids: number[][]
  asks: number[][]
}

export interface OrdersChange {
  event: ClientEventType.ORDERS,
  bids: number[][]
  asks: number[][]
}

export interface ClientError {
  event: ClientEventType.ERROR,
  error: Event,
}

export type ClientEvent 
  = ClientConnected 
  | ClientDisconnected 
  | ClientSubscribed 
  | ClientUnsubscribed 
  | OrdersStapShot 
  | OrdersChange
  | ClientError
  | ServiceClosed
  | ServiceError
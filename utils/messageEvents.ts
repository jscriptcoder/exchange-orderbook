import { Market } from './markets'

export enum ServiceEventType {
  INFO = 'info',
  SUBSCRIBED = 'subscribed',
  UNSUBSCRIBED = 'unsubscribed',
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

export type ServiceEvent 
  = ServiceInfo 
  | ServiceSubscribed 
  | ServiceUnsubscribed 
  | ServiceSnapshot 
  | ServiceOrders

export enum ClientEventType {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  SUBSCRIBED = 'subscribed',
  UNSUBSCRIBED = 'unsubscribed',
  SNAPSHOT = 'snapshot',
  ORDERS = 'orders',
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

export interface StapShot {
  event: ClientEventType.SNAPSHOT
  numLevels: number
  bids: number[][]
  asks: number[][]
}

export interface ClientOrders {
  event: ClientEventType.ORDERS,
  // TODO: to be decided
  bids: number[][]
  asks: number[][]
}

export type ClientEvent 
  = ClientConnected 
  | ClientDisconnected 
  | ClientSubscribed 
  | ClientUnsubscribed 
  | StapShot 
  | ClientOrders
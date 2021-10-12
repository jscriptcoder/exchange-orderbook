import { Market } from './markets'

export enum ServiceEventType {
  INFO = 'info',
  SUBSCRIBED = 'subscribed',
  UNSUBSCRIBED = 'unsubscribed',
}

export interface ServiceInfo {
  event: ServiceEventType.INFO
  version: number
}

export interface ServiceSubscribed {
  event: ServiceEventType.SUBSCRIBED
  feed: string,
  product_ids: string[]
}

export interface ServiceUnsubscribed {
  event: ServiceEventType.UNSUBSCRIBED
  feed: string,
  product_ids: string[]
}

export interface ServiceSnapshot {
  event: undefined
  numLevels: number
  feed: string
  product_ids: string[]
}

export interface ServiceOrders {
  event: undefined
  feed: string,
  product_id: Market,
  bids: number[]
  asks: number[]
}

export type ServiceEvent = ServiceInfo | ServiceSubscribed | ServiceUnsubscribed | ServiceSnapshot | ServiceOrders

export interface ClientOrders { }

export type ClientEvent = ClientOrders
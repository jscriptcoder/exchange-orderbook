export enum CommandType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  CONNECT = 'connect',
  CHANGE_PRODUCT = 'change-product',
}

export interface ConnectCommand {
  type: CommandType.CONNECT,
  payload: {
    productId: string
  }
}

export interface ChangeProductCommand {
  type: CommandType.CHANGE_PRODUCT,
  payload: {
    oldProductId: string
    newProductId: string
  }
}

export type ClientCommand = ConnectCommand | ChangeProductCommand

export interface ServiceCommand {
  event: CommandType
  feed: string
  product_ids: string[]
}
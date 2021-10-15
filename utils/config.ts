import markets, { MarketInfo } from './markets'

export const port: number = parseInt(process.env.PORT || '3000', 10)
export const prod: boolean = process.env.NODE_ENV === 'production'
export const wsProtocol = prod ? 'wss' : 'ws'
export const domain = prod ? 'exchange-orderbook.vercel.app' : 'localhost' // TODO: there are actually 3 domains
export const wsUrl: string = `${wsProtocol}://${domain}:${port}`

export const orderBookProtocol: string = 'order-book'
export const defaultMarket: MarketInfo = markets.PI_XBTUSD
export const defaultGroupSize: number = defaultMarket.sizes[0]
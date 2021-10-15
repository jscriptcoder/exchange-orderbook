import markets, { MarketInfo } from './markets'

export const port: number = parseInt(process.env.PORT || '3000', 10)
export const wsProtocol = process.env.NODE_ENV === 'production' ? 'wss' : 'ws'
export const wsUrl: string = `${wsProtocol}://0.0.0.0:${port}`

export const orderBookProtocol: string = 'order-book'
export const defaultMarket: MarketInfo = markets.PI_XBTUSD
export const defaultGroupSize: number = defaultMarket.sizes[0]
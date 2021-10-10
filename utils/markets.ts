export enum Market {
  PI_XBTUSD = 'PI_XBTUSD',
  PI_ETHUSD = 'PI_ETHUSD',
}

export type MarketInfo = {
  name: Market
  sizes: number[]
}

export type MarketsMap = {
  [market in Market]: MarketInfo
}

const markets: MarketsMap = {
  PI_XBTUSD: {
    name: Market.PI_XBTUSD,
    sizes: [0.5, 1, 2.5],
  },
  PI_ETHUSD: {
    name: Market.PI_ETHUSD,
    sizes: [0.05, 0.1, 0.25],
  }
}

export default markets
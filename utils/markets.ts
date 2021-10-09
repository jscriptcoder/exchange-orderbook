export enum Markets {
  PI_XBTUSD = 'PI_XBTUSD',
  PI_ETHUSD = 'PI_ETHUSD',
}

export type MarketInfo = {
  name: Markets 
  sizes: number[]
}

export type MarketsMap = {
  [market in Markets]: MarketInfo
}

const markets: MarketsMap = {
  PI_XBTUSD: {
    name: Markets.PI_XBTUSD,
    sizes: [0.5, 1, 2.5],
  },
  PI_ETHUSD: {
    name: Markets.PI_ETHUSD,
    sizes: [0.05, 0.1, 0.25],
  }
}

export default markets
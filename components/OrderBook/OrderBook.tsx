import { Select, Button, Table } from 'antd'

import styles from './OrderBook.module.css'
import useOrderBook from './useOrderBook'
import OrderTable from './OrderTable'

export default function OrderBook(): JSX.Element {
  const {
    market,
    groupSize,
    orders,
    spread,
    isFeedKilled,
    priceDecimals,
    groupSizeChange,
    toggleFeedClick,
    killFeedClick,
  } = useOrderBook()

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <h3>Order Book</h3>
        
        <div>
          Spread:
          {' '}
          <span className={styles.spread}>
            {spread
              ? `${spread[0].toFixed(1)} (${spread[1].toFixed(2)}%)`
              : '...'
            }
          </span>
        </div>

        <Select
          value={groupSize}
          className={styles.groupSelect}
          size="small"
          onChange={groupSizeChange}
        >
          {market?.sizes.map(size => (
            <Select.Option key={size} value={size}>{size}</Select.Option>
          ))}
        </Select>
      </div>

      <div className={styles.body}>
        <OrderTable
          type="buy"
          orders={orders?.bids}
          priceDecimals={priceDecimals}
        />
        <OrderTable
          type="sell"
          orders={orders?.asks}
          priceDecimals={priceDecimals}
        />
      </div>

      <div className={styles.footer}>
        <Button
          type="primary"
          onClick={toggleFeedClick}
        >
          Toogle Feed: {market?.name}
        </Button>
        <Button
          type="primary" danger
          onClick={killFeedClick}
        >
          {isFeedKilled ? 'Restart Feed' : 'Kill Feed'}
        </Button>
      </div>

    </div>
  )
}
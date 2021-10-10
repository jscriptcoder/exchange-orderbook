import { Select, Button, Table } from 'antd'

import styles from './OrderBook.module.css'
import useOrderBook from './useOrderBook'
import { amountFormatter, priceFormatter } from '../../utils/formatters'

export default function OrderBook(): JSX.Element {
  const {
    market,
    isFeedKilled,
    toggleFeedClick,
    killFeedClick,
  } = useOrderBook()

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <h3>Order Book</h3>
        <div>Spread 17.0 (0.05%)</div>
        <Select
          defaultValue="0.01"
          className={styles.groupSelect}
          size="small"
        >
          {market.sizes.map(size => (
            <Select.Option key={size} value={size}>{size}</Select.Option>
          ))}
        </Select>
      </div>

      <div className={styles.body}>
        {/* <Table className={styles.buyTable} size="small" dataSource={data} pagination={false}>
          <Table.Column
            title="TOTAL"
            dataIndex="total"
            key="total"
            align="left"
            render={(value) => amountFormatter.format(value)}
          />
          <Table.Column
            title="SIZE"
            dataIndex="size"
            key="size"
            align="center"
            render={(value) => amountFormatter.format(value)}
          />
          <Table.Column
            title="PRICE"
            dataIndex="price"
            key="price"
            align="right"
            className={styles.bidPrice}
            render={(value) => priceFormatter.format(value)}
          />
        </Table>
        <Table className={styles.sellTable} size="small" dataSource={data} pagination={false}>
          <Table.Column
            title="PRICE"
            dataIndex="price"
            key="price"
            align="left"
            className={styles.askPrice}
            render={(value) => priceFormatter.format(value)}
          />
          <Table.Column
            title="SIZE"
            dataIndex="size"
            key="size"
            align="center"
            render={(value) => amountFormatter.format(value)}
          />
          <Table.Column
            title="TOTAL"
            dataIndex="total"
            key="total"
            align="right"
            render={(value) => amountFormatter.format(value)}
          />
        </Table> */}
      </div>

      <div className={styles.footer}>
        <Button 
          type="primary"
          onClick={toggleFeedClick}
        >
          Toogle Feed: {market.name}
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
import { Table } from 'antd'
import PropTypes from 'prop-types'

import styles from './OrderTable.module.css'
import { amountFormat, priceFormat } from '../../utils/formatters'

interface OrderTableProps {
  type: 'buy' | 'sell'
  orders: number[][] | undefined
  priceDecimals: number | undefined
}

export default function OrderTable(props: OrderTableProps): JSX.Element {
  const { type, orders, priceDecimals } = props

  const tableColumns = [
    <Table.Column
      title="PRICE"
      dataIndex={0}
      key="price"
      align={ type === 'buy' ? 'right' : 'left' }
      className={styles[`${type}Price`]}
      render={(value) => priceFormat(value, priceDecimals)}
    />,
    <Table.Column
      title="SIZE"
      dataIndex={1}
      key="size"
      align="center"
      render={(value) => amountFormat(value)}
    />,
    <Table.Column
      title="TOTAL"
      dataIndex={2}
      key="total"
      align={ type === 'buy' ? 'left' : 'right' }
      render={(value) => amountFormat(value)}
    />
  ]

  if (type === 'buy') {
    tableColumns.reverse()
  }

  return (
    <Table
      className={styles[`${type}Table`]}
      size="small"
      dataSource={orders}
      pagination={false}
      scroll={{ y: 350 }}
      rowKey={(order: number[]) => order[0]}
    >
      {tableColumns}
    </Table>
  )
}

OrderTable.propTypes = {
  type: PropTypes.oneOf(['buy', 'sell']),
  orders: PropTypes.array,
  priceDecimals: PropTypes.number,
}

OrderTable.defaultProps = {
  priceDecimals: 2,
}
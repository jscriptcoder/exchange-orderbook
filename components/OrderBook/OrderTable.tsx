import { Table } from 'antd'

import styles from './OrderTable.module.css'
import { amountFormatter, priceFormatter } from '../../utils/formatters'

interface OrderTableProps {
  type: 'buy' | 'sell'
  orders: number[][] | undefined
}

export default function OrderTable(props: OrderTableProps): JSX.Element {
  const { type, orders } = props

  const tableColumns = [
    <Table.Column
      title="PRICE"
      dataIndex={0}
      key="price"
      align={ type === 'buy' ? 'right' : 'left' }
      className={styles[`${type}Price`]}
      render={(value) => priceFormatter.format(value)}
    />,
    <Table.Column
      title="SIZE"
      dataIndex={1}
      key="size"
      align="center"
      render={(value) => amountFormatter.format(value)}
    />,
    <Table.Column
      title="TOTAL"
      dataIndex={2}
      key="total"
      align={ type === 'buy' ? 'left' : 'right' }
      render={(value) => amountFormatter.format(value)}
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
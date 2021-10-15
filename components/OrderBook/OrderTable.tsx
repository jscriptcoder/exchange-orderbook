import { Table } from 'antd'
import PropTypes, { number } from 'prop-types'

import styles from './OrderTable.module.css'
import { amountFormat, normalize, priceFormat } from '../../utils/formatters'
import useOrderTable, { TypeOrder } from './useOrderTable'

interface OrderTableProps {
  type: TypeOrder
  orders: number[][] | undefined
  priceDecimals: number | undefined
}

export default function OrderTable(props: OrderTableProps): JSX.Element {
  const { type, orders, priceDecimals } = props
  const {
    flipTable,
    maxTotal,
  } = useOrderTable(type, orders)

  const tableColumns = [
    <Table.Column
      title="PRICE"
      dataIndex={0}
      key="price"
      align={ flipTable ? 'right' : 'left' }
      className={styles[`${type}Price`]}
      render={(value: number, order: number[]) => {
        // calculate the width of the total bar, normalizing
        // between 0 and 360px
        const width: number = normalize(order[2], maxTotal, 0) * 360
        return (
          <div>
            <span>{priceFormat(value, priceDecimals)}</span>
            <div
              className={styles[`${type}TotalBar`]}
              style={{
                width,
                [flipTable ? 'right' : 'left']: 0
              }}
            />
          </div>
        )
      }}
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
      align={ flipTable ? 'left' : 'right' }
      render={(value) => amountFormat(value)}
    />
  ]

  if (flipTable) {
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
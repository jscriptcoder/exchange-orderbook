const {
  copyOrders,
  sortOrders,
  addTotal,
  groupOrders,
  processOrders,
  updateOrders
} = require('./workerHelpers')

const orders = [
  [5.5, 2], 
  [2.6, 4],
  [3.2, 4],
]

test('copyOrders', () => {
  const copy = copyOrders(orders)

  // make sure all the references are different
  expect(orders !== copy).toBeTruthy()
  orders.forEach((order, i) => expect(order !== copy[i]).toBeTruthy())
})

test('sortOrders', () => {
  const sortedAsc = sortOrders(copyOrders(orders), 'asc')

  // sorted ascendently by price
  expect(sortedAsc[0][0] === 2.6).toBeTruthy()
  expect(sortedAsc[1][0] === 3.2).toBeTruthy()
  expect(sortedAsc[2][0] === 5.5).toBeTruthy()

  const sortedDesc = sortOrders(copyOrders(orders), 'desc')

  // sorted descendently by price
  expect(sortedDesc[0][0] === 5.5).toBeTruthy()
  expect(sortedDesc[1][0] === 3.2).toBeTruthy()
  expect(sortedDesc[2][0] === 2.6).toBeTruthy()
})

test('addTotal', () => {
  const withTotal = addTotal(orders)

  // 3rd column with the accumulation
  expect(withTotal[0][2] === 2).toBeTruthy()
  expect(withTotal[1][2] === 6).toBeTruthy()
  expect(withTotal[2][2] === 10).toBeTruthy()
})

test('updateOrders', () => {
  const copy = copyOrders(orders)
  const changes = [
    [5.5, 0], 
    [2.6, 4],
    [3.2, 1],
  ]

  updateOrders(changes, copy, 'desc')

  expect(copy.length === 2).toBeTruthy() // price 5 level is removed

  // it's sorted descendently
  expect(copy[0][0] === 3.2).toBeTruthy()
  expect(copy[1][0] === 2.6).toBeTruthy()

  // sizes have been updated
  expect(copy[0][1] === 1).toBeTruthy() // changes from 4 to 1
  expect(copy[1][1] === 4).toBeTruthy() // remains the same
})

test('groupOrders', () => {
  const grouped = groupOrders(addTotal(sortOrders(orders, 'desc')), 0.5, 'desc')

  expect(grouped[0][0] === 5.5).toBeTruthy()
  expect(grouped[1][0] === 3.0).toBeTruthy() // 3.2 falls into 3.0 price levels
  expect(grouped[2][0] === 2.5).toBeTruthy() // 2.6 falls into 2.5 price levels
})

test('processOrders', () => {
  const copy = copyOrders(orders)
  const processed = processOrders(copy, 1, 'asc', 2)

  expect(processed.length === 2).toBeTruthy() // we're limiting to 2 orders
  expect(processed[0][0] === 2.0).toBeTruthy() // 2.6 falls into 2.0 price levels
  expect(processed[0][2] === 4).toBeTruthy()
  expect(processed[1][0] === 3.0).toBeTruthy() // 3.2 falls into 3.0 price levels
  expect(processed[1][2] === 8).toBeTruthy() // accumulated total 4 + 4
})
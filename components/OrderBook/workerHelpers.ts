/**
 * These are helper functions for the WebWorker to do some "heavy" computation, 
 * extracted in order to be able to easily unit-test them in isolation.
 */

interface InfoPriceLevel {
  price: number,
  size: number,
  total: number,
}

interface PriceLevels {
  [price: string]: InfoPriceLevel
}

type Sort = 'asc' | 'desc'

// 2 levels deep copy. Mutations are evil :-(
export function copyOrders(orders: number[][]): number[][] {
  return orders.map((order: number[]) => order.slice())
}

// Sorts the orders by price
export function sortOrders(orders: number[][], sort: Sort): number[][] {
  return orders.sort((order1: number[], order2: number[]) => (
    (order1[0] > order2[0] ? 1 : -1) * (sort === 'asc' ? 1 : -1)
  ))
}

// Group the list of orders by market tick size
export const groupOrders = (orders: number[][], groupSize: number, sort: Sort): number[][] => {
  const priceLevels: PriceLevels = orders.reduce((acc: PriceLevels, order: number[]) => {
    const [price, size, total] = order

    // This is key to identify price levels according to the groupSize.
    // Simple calculation not easy to figure out :-/
    const priceLevel: number = Math.floor(price / groupSize) * groupSize

    const strPriceLevel: string = `${priceLevel}`
    const infoPriceLevel: InfoPriceLevel = acc[strPriceLevel]

    acc[strPriceLevel] = infoPriceLevel
      ? { // accumulate when grouping
        price: priceLevel,
        size: infoPriceLevel.size + size,
        total: infoPriceLevel.total + total
      }
      : {
        price: priceLevel,
        size,
        total,
      }

    return acc
  }, <PriceLevels>{})

  // Turn it back to an array of [price, size, total]
  const groupedOrders = Object
    .values(priceLevels)
    .map((infoPriceLevel: InfoPriceLevel) => {
      return [infoPriceLevel.price, infoPriceLevel.size, infoPriceLevel.total]
    })

  return sortOrders(groupedOrders, sort)
}

// Calculate and add total size column (current size + accumulated)
export function addTotal(orders: number[][]): number[][] {
  return orders.reduce((acc: number[][], order: number[]) => {
    const totalSize = order[1] + (acc[acc.length - 1] ? acc[acc.length - 1][2] : 0)
    acc.push([...order, totalSize])
    return acc
  }, [])
}

export function processOrders(orders: number[][], groupSize: number, sort: Sort, limit: number): number[][] {
  return groupOrders(addTotal(sortOrders(orders, sort)), groupSize, sort).slice(0, limit) // when the pipe operator??
}

// Will keep 'orders' (mutation!! :-O) updated with changes coming from the service
export function updateOrders(changes: number[][], orders: number[][], sort: Sort): number[][] {
  changes.forEach((change: number[]) => {
    const orderIndex = orders.findIndex((order: number[]) => order[0] === change[0]) // same price level?

    if (orderIndex >= 0) {
      if (change[1] > 0) {
        orders[orderIndex][1] = change[1] // change the size
      } else {
        orders.splice(orderIndex, 1) // size is 0, delete the order
      }
    } else if (change[1] > 0) {
      orders.push(change)
    }
  })

  return sortOrders(orders, sort)
}
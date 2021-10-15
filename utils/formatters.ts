export const amountFormat = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US')
  return formatter.format(value)
}

export const priceFormat = (value: number, decimals: number = 2) => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
  })

  return formatter.format(value)
}

export const normalize = (value: number, max: number, min: number): number => {
  if (max - min === 0) return 0
  return (value - min) / (max - min)
}
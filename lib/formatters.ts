const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value)
}

export function formatPercent(value: number) {
  return percentFormatter.format(value)
}

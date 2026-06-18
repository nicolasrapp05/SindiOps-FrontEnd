/** Valor numérico formatado sem símbolo: 1.234,56 */
export function formatCurrencyAmount(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Valor com símbolo R$ (exibição em textos, tabelas, toasts). */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function numberToCents(value: number): number {
  return Math.round(value * 100)
}

export function centsToNumber(cents: number): number {
  return cents / 100
}

export function parseCurrencyDigits(digits: string): number | undefined {
  const only = digits.replace(/\D/g, "")
  if (only === "") return undefined
  return centsToNumber(parseInt(only, 10))
}

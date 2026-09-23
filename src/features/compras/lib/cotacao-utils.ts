import type { Cotacao } from "../types/compra.types"

export function calcValorTotalCotacao(valorUnitario: number, quantidade: number): number {
  return Math.round(valorUnitario * quantidade * 100) / 100
}

export function somarValorTotalCotacao(
  linhas: { valorUnitario: number; quantidade: number }[],
): number {
  const soma = linhas.reduce(
    (acc, linha) => acc + calcValorTotalCotacao(linha.valorUnitario, linha.quantidade),
    0,
  )
  return Math.round(soma * 100) / 100
}

export function getMenorValorTotal(cotacoes: Pick<Cotacao, "valorTotal">[]): number | null {
  if (cotacoes.length === 0) return null
  return Math.min(...cotacoes.map((c) => c.valorTotal))
}

export { formatBRL as brl } from "@/lib/currency"

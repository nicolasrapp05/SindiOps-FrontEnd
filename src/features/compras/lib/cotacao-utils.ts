import type { Cotacao } from "../types/compra.types"

export function resolveQuantidadeCotacao(
  quantidadeCotacao: number | undefined | null,
  quantidadeSolicitacao: number,
): number {
  if (
    quantidadeCotacao != null &&
    !Number.isNaN(quantidadeCotacao) &&
    quantidadeCotacao > 0
  ) {
    return quantidadeCotacao
  }
  return quantidadeSolicitacao
}

export function calcValorTotalCotacao(valorUnitario: number, quantidade: number): number {
  return Math.round(valorUnitario * quantidade * 100) / 100
}

export function getMenorValorUnitario(cotacoes: Pick<Cotacao, "valorUnitario">[]): number | null {
  if (cotacoes.length === 0) return null
  return Math.min(...cotacoes.map((c) => c.valorUnitario))
}

export { formatBRL as brl } from "@/lib/currency"

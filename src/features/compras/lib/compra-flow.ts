import type { UserCargo } from "@/types"
import type { CompraStatus } from "../types/compra.types"

export const canManageCotacoes = (status: CompraStatus) => status === "nova"

export const isSindico = (cargo: UserCargo) => cargo === "sindico"

export function getAprovarBlockReason(
  status: CompraStatus,
  totalCotacoes: number,
  temCotacaoSelecionada: boolean,
): string | null {
  if (status !== "nova") return "Apenas solicitações novas podem ser aprovadas"
  if (totalCotacoes < 1) return "Cadastre ao menos uma cotação antes de aprovar"
  if (!temCotacaoSelecionada) return "Selecione uma cotação vencedora antes de aprovar"
  return null
}

export function getCotacaoReadinessLabel(
  status: CompraStatus,
  totalCotacoes: number,
  temCotacaoSelecionada: boolean,
): { label: string; className: string } | null {
  if (status !== "nova") return null
  if (totalCotacoes === 0) {
    return { label: "Sem cotações", className: "bg-gray-100 text-gray-500" }
  }
  if (!temCotacaoSelecionada) {
    return { label: "Sem vencedora", className: "bg-amber-100 text-amber-800" }
  }
  return { label: "Pronta para aprovar", className: "bg-emerald-100 text-emerald-700" }
}

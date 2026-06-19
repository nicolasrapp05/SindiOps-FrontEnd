import type { ContratoStatus } from "@/features/contratos/types/contrato.types"

export const CONTRATO_STATUS_LABEL: Record<ContratoStatus, string> = {
  active: "Vigente",
  expiring: "Expirando",
  expired: "Expirado",
  cancelled: "Cancelado",
}

export const CONTRATO_STATUS_FILTER_OPTIONS: { value: "all" | ContratoStatus; label: string }[] = [
  { value: "all", label: "Todos os status" },
  { value: "active", label: "Vigentes" },
  { value: "expiring", label: "Expirando" },
  { value: "expired", label: "Expirados" },
  { value: "cancelled", label: "Cancelados" },
]

export function podeCancelarContrato(status: ContratoStatus): boolean {
  return status !== "cancelled"
}

export function podeReativarContrato(status: ContratoStatus): boolean {
  return status === "cancelled"
}

/** Destaque visual alinhado ao status calculado pela API (janela de 30 dias). */
export function contratoRowHighlightClass(status: ContratoStatus): string | undefined {
  if (status === "expiring") return "bg-orange-50/50 hover:bg-orange-50/70"
  if (status === "expired") return "bg-red-50/50 hover:bg-red-50/70"
  return undefined
}

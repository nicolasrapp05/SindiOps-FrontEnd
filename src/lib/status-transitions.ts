/**
 * Regras de transição de status compartilhadas entre Ocorrências,
 * Solicitações de Manutenção e Solicitações de Compra.
 *
 * nova     → em_andamento | cancelada
 * cancelada → em_andamento
 * em_andamento → finalizada | cancelada
 * finalizada   → (estado terminal, sem transições)
 */

export type FluxoStatus = "nova" | "em_andamento" | "finalizada" | "cancelada"

export const FLUXO_STATUS_LABEL: Record<FluxoStatus, string> = {
  nova: "Nova",
  em_andamento: "Em Andamento",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
}

const TRANSICOES: Record<FluxoStatus, FluxoStatus[]> = {
  nova: ["em_andamento", "cancelada"],
  cancelada: ["em_andamento"],
  em_andamento: ["finalizada", "cancelada"],
  finalizada: [],
}

/** Retorna os status para os quais é possível transicionar a partir de `atual`. */
export function proximosStatus(atual: FluxoStatus): FluxoStatus[] {
  return TRANSICOES[atual] ?? []
}

/** Retorna true quando o status não possui transições de saída. */
export function isStatusFinal(status: FluxoStatus): boolean {
  return TRANSICOES[status].length === 0
}

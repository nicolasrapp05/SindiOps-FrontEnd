import type { UserCargo } from "@/types"

export const CARGO_GROUPS = {
  ALL: ["sindico", "secretario", "zelador", "porteiro", "outro"] as UserCargo[],
  EXCEPT_PORTEIRO: ["sindico", "secretario", "zelador", "outro"] as UserCargo[],
  ADMIN: ["sindico", "secretario"] as UserCargo[],
  SINDICO_ONLY: ["sindico"] as UserCargo[],
} as const

export function isAllowedCargo(cargo: UserCargo | null | undefined, allowed: UserCargo[]): boolean {
  return !!cargo && allowed.includes(cargo)
}

export function canAccessAdmin(cargo: UserCargo | null | undefined): boolean {
  return isAllowedCargo(cargo, CARGO_GROUPS.ADMIN)
}

export function canAccessManutencoes(cargo: UserCargo | null | undefined): boolean {
  return isAllowedCargo(cargo, CARGO_GROUPS.EXCEPT_PORTEIRO)
}

export function canExportRelatorios(cargo: UserCargo | null | undefined): boolean {
  return canAccessAdmin(cargo)
}

export type DashboardAlertKey =
  | "manutencoesVencidas"
  | "manutencoesProximas"
  | "ocorrenciasAbertas"
  | "comprasPendentes"
  | "contratosVencendo"

export function canSeeDashboardAlert(
  cargo: UserCargo | null | undefined,
  key: DashboardAlertKey,
): boolean {
  switch (key) {
    case "manutencoesVencidas":
    case "manutencoesProximas":
      return canAccessManutencoes(cargo)
    case "ocorrenciasAbertas":
      return isAllowedCargo(cargo, CARGO_GROUPS.ALL)
    case "comprasPendentes":
    case "contratosVencendo":
      return canAccessAdmin(cargo)
    default:
      return false
  }
}

export function canSeeAgendaTipo(
  cargo: UserCargo | null | undefined,
  tipo: "manutencao_obrigatoria" | "contrato" | "mandato",
): boolean {
  switch (tipo) {
    case "manutencao_obrigatoria":
      return canAccessManutencoes(cargo)
    case "contrato":
      return canAccessAdmin(cargo)
    case "mandato":
      return isAllowedCargo(cargo, CARGO_GROUPS.SINDICO_ONLY)
    default:
      return false
  }
}

export function filterAgendaByCargo<T extends { tipo: "manutencao_obrigatoria" | "contrato" | "mandato" }>(
  cargo: UserCargo | null | undefined,
  agenda: T[],
): T[] {
  return agenda.filter((item) => canSeeAgendaTipo(cargo, item.tipo))
}

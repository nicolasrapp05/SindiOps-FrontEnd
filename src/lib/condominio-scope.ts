import type { SortColumn } from "@/lib/list-sort"

export const ALL_CONDOMINIOS_ID = "all"
export const ALL_CONDOMINIOS_NOME = "Todos os condomínios"

export function isTodosCondominios(id: string | null | undefined): boolean {
  return id === ALL_CONDOMINIOS_ID
}

export function escopoCondominioAtivo(id: string | null | undefined): boolean {
  return !!id
}

export function condominioIdDaConsulta(id: string | null | undefined): string | undefined {
  if (!id || isTodosCondominios(id)) return undefined
  return id
}

export function colunasComCondominio(todos: boolean, colunas: SortColumn[]): SortColumn[] {
  if (!todos || colunas.some((coluna) => coluna.key === "condominio")) return colunas
  return [{ key: "condominio", label: "Condomínio" }, ...colunas]
}

import { get, post, put, patch, del } from "@/lib/api"
import type {
  CreateManutencaoObrigatoriaRequest,
  ManutencaoFilters,
  ManutencaoObrigatoria,
  RealizarManutencaoRequest,
} from "../types/manutencao-obrigatoria.types"

export function getManutencoesObrigatorias(
  condominioId: string,
  filters?: ManutencaoFilters,
) {
  return get<ManutencaoObrigatoria[]>("/manutencoes-obrigatorias", {
    condominioId,
    ...filters,
  })
}

export function createManutencaoObrigatoria(data: CreateManutencaoObrigatoriaRequest) {
  return post<ManutencaoObrigatoria>("/manutencoes-obrigatorias", data)
}

export function updateManutencaoObrigatoria(
  id: string,
  data: CreateManutencaoObrigatoriaRequest,
) {
  return put<ManutencaoObrigatoria>(`/manutencoes-obrigatorias/${id}`, data)
}

export function realizarManutencao(id: string, data: RealizarManutencaoRequest) {
  return patch<ManutencaoObrigatoria>(`/manutencoes-obrigatorias/${id}/realizar`, data)
}

export function deleteManutencaoObrigatoria(id: string) {
  return del<null>(`/manutencoes-obrigatorias/${id}`)
}

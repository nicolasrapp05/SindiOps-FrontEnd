import { getPaginated, get, post, put, del } from "@/lib/api"
import type {
  Morador,
  CreateMoradorRequest,
  MoradoresFilters,
} from "../types/morador.types"

export function getMoradores(condominioId: string, filters?: MoradoresFilters) {
  return getPaginated<Morador>("/moradores", { condominioId, ...filters })
}

export function getMorador(id: string) {
  return get<Morador>(`/moradores/${id}`)
}

export function createMorador(data: CreateMoradorRequest) {
  return post<Morador>("/moradores", data)
}

export function updateMorador(id: string, data: Partial<CreateMoradorRequest>) {
  return put<Morador>(`/moradores/${id}`, data)
}

export function deleteMorador(id: string) {
  return del<null>(`/moradores/${id}`)
}

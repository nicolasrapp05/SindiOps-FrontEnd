import { get, post, put, del } from "@/lib/api"
import type {
  Condominio,
  CreateCondominioRequest,
  Bloco,
} from "../types/condominio.types"

export function getCondominios(): Promise<Condominio[]> {
  return get<Condominio[]>("/condominios")
}

export function getCondominio(id: string): Promise<Condominio> {
  return get<Condominio>(`/condominios/${id}`)
}

export function createCondominio(data: CreateCondominioRequest): Promise<Condominio> {
  return post<Condominio>("/condominios", data)
}

export function updateCondominio(id: string, data: CreateCondominioRequest): Promise<Condominio> {
  return put<Condominio>(`/condominios/${id}`, data)
}

export function deleteCondominio(id: string): Promise<null> {
  return del<null>(`/condominios/${id}`)
}

export function getBlocos(condominioId: string): Promise<Bloco[]> {
  return get<Bloco[]>(`/condominios/${condominioId}/blocos`)
}

export function createBloco(condominioId: string, nome: string): Promise<Bloco> {
  return post<Bloco>(`/condominios/${condominioId}/blocos`, { nome })
}

export function createUnidade(
  condominioId: string,
  blocoId: string,
  numero: string,
): Promise<{ id: string; numero: string }> {
  return post(`/condominios/${condominioId}/blocos/${blocoId}/unidades`, { numero })
}

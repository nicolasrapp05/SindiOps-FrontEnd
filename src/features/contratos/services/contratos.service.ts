import { getPaginated, get, post, put, patch } from "@/lib/api"
import type {
  Contrato,
  ContratosFilters,
  CreateContratoRequest,
} from "../types/contrato.types"

export function getContratos(condominioId: string | undefined, filters?: ContratosFilters) {
  return getPaginated<Contrato>("/contratos", {
    ...(condominioId ? { condominioId } : {}),
    ...filters,
  })
}

export function getContrato(id: string) {
  return get<Contrato>(`/contratos/${id}`)
}

export function createContrato(data: CreateContratoRequest) {
  return post<Contrato>("/contratos", data)
}

export function updateContrato(id: string, data: CreateContratoRequest) {
  return put<Contrato>(`/contratos/${id}`, data)
}

export function cancelarContrato(id: string) {
  return patch<Contrato>(`/contratos/${id}/status`, { status: "cancelled" })
}

export function reativarContrato(id: string) {
  return patch<Contrato>(`/contratos/${id}/reativar`, {})
}

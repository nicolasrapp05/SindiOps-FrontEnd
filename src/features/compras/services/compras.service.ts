import { get, post, put, patch, del } from "@/lib/api"
import type {
  SolicitacaoCompra,
  CreateSolicitacaoCompraRequest,
  ComprasFilters,
  CreateCotacaoRequest,
  Cotacao,
  CompraStatus,
} from "../types/compra.types"

export function getSolicitacoesCompra(condominioId: string, filters?: ComprasFilters) {
  return get<SolicitacaoCompra[]>("/solicitacoes-compra", {
    condominioId,
    ...filters,
  })
}

export function getSolicitacaoCompra(id: string) {
  return get<SolicitacaoCompra>(`/solicitacoes-compra/${id}`)
}

export function createSolicitacaoCompra(data: CreateSolicitacaoCompraRequest) {
  return post<SolicitacaoCompra>("/solicitacoes-compra", data)
}

export function updateSolicitacaoCompra(
  id: string,
  data: Partial<CreateSolicitacaoCompraRequest>,
) {
  return put<SolicitacaoCompra>(`/solicitacoes-compra/${id}`, data)
}

export function aprovarSolicitacao(id: string) {
  return patch<SolicitacaoCompra>(`/solicitacoes-compra/${id}/aprovar`, {})
}

export function updateSolicitacaoStatus(id: string, status: CompraStatus) {
  return patch<SolicitacaoCompra>(`/solicitacoes-compra/${id}/status`, { status })
}

export function getCotacoes(solicitacaoId: string) {
  return get<Cotacao[]>(`/solicitacoes-compra/${solicitacaoId}/cotacoes`)
}

export function createCotacao(solicitacaoId: string, data: CreateCotacaoRequest) {
  return post<Cotacao>(`/solicitacoes-compra/${solicitacaoId}/cotacoes`, data)
}

export function selecionarCotacao(solicitacaoId: string, cotacaoId: string) {
  return patch<Cotacao>(
    `/solicitacoes-compra/${solicitacaoId}/cotacoes/${cotacaoId}/selecionar`,
    {},
  )
}

export function deleteCotacao(solicitacaoId: string, cotacaoId: string) {
  return del<null>(`/solicitacoes-compra/${solicitacaoId}/cotacoes/${cotacaoId}`)
}

import { getPaginated, post, put, patch } from "@/lib/api"
import type {
  CreateSolicitacaoManutencaoRequest,
  SolicitacaoFilters,
  SolicitacaoManutencao,
  SolicitacaoStatus,
} from "../types/solicitacao-manutencao.types"

export function getSolicitacoesManutencao(condominioId: string, filters?: SolicitacaoFilters) {
  return getPaginated<SolicitacaoManutencao>("/solicitacoes-manutencao", {
    condominioId,
    ...filters,
  })
}

export function createSolicitacaoManutencao(data: CreateSolicitacaoManutencaoRequest) {
  return post<SolicitacaoManutencao>("/solicitacoes-manutencao", data)
}

export function updateSolicitacaoManutencao(
  id: string,
  data: Partial<CreateSolicitacaoManutencaoRequest> & { status?: SolicitacaoStatus },
) {
  return put<SolicitacaoManutencao>(`/solicitacoes-manutencao/${id}`, data)
}

export function updateSolicitacaoStatus(
  id: string,
  status: SolicitacaoStatus,
  dataConclusao?: string,
) {
  return patch<SolicitacaoManutencao>(`/solicitacoes-manutencao/${id}/status`, {
    status,
    dataConclusao,
  })
}

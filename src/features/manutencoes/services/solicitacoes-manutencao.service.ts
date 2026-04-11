import { get, post, put, patch } from "@/lib/api"
import type {
  CreateSolicitacaoManutencaoRequest,
  SolicitacaoFilters,
  SolicitacaoManutencao,
  SolicitacaoStatus,
} from "../types/solicitacao-manutencao.types"

export function getSolicitacoesManutencao(condominioId: string, filters?: SolicitacaoFilters) {
  return get<SolicitacaoManutencao[]>("/solicitacoes-manutencao", {
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

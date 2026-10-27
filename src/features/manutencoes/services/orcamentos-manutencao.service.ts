import { del, get, patch, post, put } from "@/lib/api"
import type {
  CreateOrcamentoManutencaoRequest,
  OrcamentoManutencao,
} from "../types/orcamento-manutencao.types"
import type { SolicitacaoManutencao } from "../types/solicitacao-manutencao.types"

export function getOrcamentosManutencao(solicitacaoId: string) {
  return get<OrcamentoManutencao[]>(`/solicitacoes-manutencao/${solicitacaoId}/orcamentos`)
}

export function createOrcamentoManutencao(solicitacaoId: string, data: CreateOrcamentoManutencaoRequest) {
  return post<OrcamentoManutencao>(`/solicitacoes-manutencao/${solicitacaoId}/orcamentos`, data)
}

export function updateOrcamentoManutencao(
  solicitacaoId: string,
  orcamentoId: string,
  data: CreateOrcamentoManutencaoRequest,
) {
  return put<OrcamentoManutencao>(
    `/solicitacoes-manutencao/${solicitacaoId}/orcamentos/${orcamentoId}`,
    data,
  )
}

export function selecionarOrcamentoManutencao(solicitacaoId: string, orcamentoId: string) {
  return patch<null>(
    `/solicitacoes-manutencao/${solicitacaoId}/orcamentos/${orcamentoId}/selecionar`,
  )
}

export function deleteOrcamentoManutencao(solicitacaoId: string, orcamentoId: string) {
  return del<null>(`/solicitacoes-manutencao/${solicitacaoId}/orcamentos/${orcamentoId}`)
}

export function aprovarOrcamentoManutencao(solicitacaoId: string) {
  return patch<SolicitacaoManutencao>(`/solicitacoes-manutencao/${solicitacaoId}/orcamentos/aprovar`)
}

export function reabrirOrcamentoManutencao(solicitacaoId: string) {
  return patch<SolicitacaoManutencao>(`/solicitacoes-manutencao/${solicitacaoId}/orcamentos/reabrir`)
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getSolicitacoesManutencao,
  createSolicitacaoManutencao,
  updateSolicitacaoStatus,
} from "../services/solicitacoes-manutencao.service"
import type {
  CreateSolicitacaoManutencaoRequest,
  SolicitacaoFilters,
  SolicitacaoStatus,
} from "../types/solicitacao-manutencao.types"

export function useSolicitacoesManutencao(condominioId: string, filters?: SolicitacaoFilters) {
  return useQuery({
    queryKey: ["solicitacoes-manutencao", condominioId, filters],
    queryFn: () => getSolicitacoesManutencao(condominioId, filters),
    enabled: !!condominioId,
  })
}

export function useCreateSolicitacaoManutencao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSolicitacaoManutencaoRequest) => createSolicitacaoManutencao(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["solicitacoes-manutencao"] })
      toast.success("Solicitação criada com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar solicitação"),
  })
}

export function useUpdateSolicitacaoStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      dataConclusao,
    }: {
      id: string
      status: SolicitacaoStatus
      dataConclusao?: string
    }) => updateSolicitacaoStatus(id, status, dataConclusao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["solicitacoes-manutencao"] })
      toast.success("Status atualizado")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status"),
  })
}

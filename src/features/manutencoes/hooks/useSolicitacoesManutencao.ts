import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import { upsertPaginatedItem } from "@/lib/query-cache"
import {
  getSolicitacoesManutencao,
  createSolicitacaoManutencao,
  updateSolicitacaoStatus,
} from "../services/solicitacoes-manutencao.service"
import type {
  CreateSolicitacaoManutencaoRequest,
  SolicitacaoFilters,
  SolicitacaoManutencao,
  SolicitacaoStatus,
} from "../types/solicitacao-manutencao.types"

export function useSolicitacoesManutencao(condominioId: string, filters?: SolicitacaoFilters) {
  return useQuery({
    queryKey: ["solicitacoes-manutencao", condominioId, filters],
    queryFn: () => getSolicitacoesManutencao(condominioId, filters),
    enabled: !!condominioId,
    placeholderData: keepPreviousData,
  })
}

export function useCreateSolicitacaoManutencao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSolicitacaoManutencaoRequest) => createSolicitacaoManutencao(data),
    onSuccess: (solicitacao) => {
      upsertPaginatedItem<SolicitacaoManutencao>(qc, ["solicitacoes-manutencao"], solicitacao, {
        prependIfMissing: true,
      })
      toast.success("Solicitação criada com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao criar solicitação")),
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
    onSuccess: (solicitacao) => {
      upsertPaginatedItem<SolicitacaoManutencao>(qc, ["solicitacoes-manutencao"], solicitacao)
      toast.success("Status atualizado")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao atualizar status")),
  })
}

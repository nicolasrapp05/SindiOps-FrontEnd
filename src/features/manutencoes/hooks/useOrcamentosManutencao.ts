import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import { upsertPaginatedItem } from "@/lib/query-cache"
import {
  aprovarOrcamentoManutencao,
  createOrcamentoManutencao,
  deleteOrcamentoManutencao,
  getOrcamentosManutencao,
  reabrirOrcamentoManutencao,
  selecionarOrcamentoManutencao,
  updateOrcamentoManutencao,
} from "../services/orcamentos-manutencao.service"
import type {
  CreateOrcamentoManutencaoRequest,
  OrcamentoManutencao,
} from "../types/orcamento-manutencao.types"
import type { SolicitacaoManutencao } from "../types/solicitacao-manutencao.types"

function sincronizarSolicitacao(
  qc: ReturnType<typeof useQueryClient>,
  solicitacao: SolicitacaoManutencao,
) {
  upsertPaginatedItem<SolicitacaoManutencao>(qc, ["solicitacoes-manutencao"], solicitacao)
  qc.setQueryData(["solicitacoes-manutencao", "detail", solicitacao.id], solicitacao)
}

export function useOrcamentosManutencao(solicitacaoId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["orcamentos-manutencao", solicitacaoId],
    queryFn: () => getOrcamentosManutencao(solicitacaoId),
    enabled: enabled && !!solicitacaoId,
  })
}

export function useCreateOrcamentoManutencao(solicitacaoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrcamentoManutencaoRequest) =>
      createOrcamentoManutencao(solicitacaoId, data),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["orcamentos-manutencao", solicitacaoId] }),
        qc.invalidateQueries({ queryKey: ["solicitacoes-manutencao"] }),
      ])
      toast.success("Orçamento adicionado")
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao adicionar orçamento")),
  })
}

export function useUpdateOrcamentoManutencao(solicitacaoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      orcamentoId,
      data,
    }: {
      orcamentoId: string
      data: CreateOrcamentoManutencaoRequest
    }) => updateOrcamentoManutencao(solicitacaoId, orcamentoId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["orcamentos-manutencao", solicitacaoId] })
      toast.success("Orçamento atualizado")
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao atualizar orçamento")),
  })
}

export function useSelecionarOrcamentoManutencao(solicitacaoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orcamentoId: string) => selecionarOrcamentoManutencao(solicitacaoId, orcamentoId),
    onMutate: async (orcamentoId) => {
      const key = ["orcamentos-manutencao", solicitacaoId] as const
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<OrcamentoManutencao[]>(key)
      if (previous) {
        qc.setQueryData(
          key,
          previous.map((orcamento) => ({ ...orcamento, selecionada: orcamento.id === orcamentoId })),
        )
      }
      return { previous, key }
    },
    onError: (err, _orcamentoId, context) => {
      if (context?.previous) qc.setQueryData(context.key, context.previous)
      toast.error(getApiErrorMessage(err, "Erro ao selecionar orçamento"))
    },
    onSuccess: async () => {
      toast.success("Orçamento selecionado")
      await qc.invalidateQueries({ queryKey: ["solicitacoes-manutencao"] })
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ["orcamentos-manutencao", solicitacaoId] })
    },
  })
}

export function useDeleteOrcamentoManutencao(solicitacaoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orcamentoId: string) => deleteOrcamentoManutencao(solicitacaoId, orcamentoId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["orcamentos-manutencao", solicitacaoId] }),
        qc.invalidateQueries({ queryKey: ["solicitacoes-manutencao"] }),
      ])
      toast.success("Orçamento removido")
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao remover orçamento")),
  })
}

export function useAprovarOrcamentoManutencao(solicitacaoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => aprovarOrcamentoManutencao(solicitacaoId),
    onSuccess: async (solicitacao) => {
      sincronizarSolicitacao(qc, solicitacao)
      await qc.invalidateQueries({ queryKey: ["orcamentos-manutencao", solicitacaoId] })
      toast.success("Orçamento aprovado")
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao aprovar orçamento")),
  })
}

export function useReabrirOrcamentoManutencao(solicitacaoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => reabrirOrcamentoManutencao(solicitacaoId),
    onSuccess: async (solicitacao) => {
      sincronizarSolicitacao(qc, solicitacao)
      await qc.invalidateQueries({ queryKey: ["orcamentos-manutencao", solicitacaoId] })
      toast.success("Orçamento reaberto")
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao reabrir orçamento")),
  })
}

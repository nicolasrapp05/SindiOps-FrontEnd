import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import {
  patchDetailCache,
  patchPaginatedItem,
  setDetailCache,
  upsertPaginatedItem,
} from "@/lib/query-cache"
import {
  getSolicitacoesCompra,
  getSolicitacaoCompra,
  createSolicitacaoCompra,
  aprovarSolicitacao,
  updateSolicitacaoStatus,
  selecionarCotacao,
  createCotacao,
  updateCotacao,
  deleteCotacao,
} from "../services/compras.service"
import type {
  ComprasFilters,
  CompraStatus,
  CreateSolicitacaoCompraRequest,
  CreateCotacaoRequest,
  SolicitacaoCompra,
} from "../types/compra.types"

function patchCotacaoSelecionada(
  solicitacao: SolicitacaoCompra,
  cotacaoId: string,
): SolicitacaoCompra {
  if (!solicitacao.cotacoes?.length) return solicitacao
  return {
    ...solicitacao,
    temCotacaoSelecionada: true,
    cotacoes: solicitacao.cotacoes.map((c) => ({
      ...c,
      selecionada: c.id === cotacaoId,
    })),
  }
}

function syncSolicitacaoCompraCache(
  qc: ReturnType<typeof useQueryClient>,
  solicitacao: SolicitacaoCompra,
) {
  upsertPaginatedItem<SolicitacaoCompra>(qc, ["solicitacoes-compra"], solicitacao)
  setDetailCache(qc, ["solicitacoes-compra", "detail", solicitacao.id], solicitacao)
}

function patchSolicitacaoDetail(
  qc: ReturnType<typeof useQueryClient>,
  solicitacaoId: string,
  updater: (current: SolicitacaoCompra) => SolicitacaoCompra,
) {
  patchDetailCache<SolicitacaoCompra>(
    qc,
    ["solicitacoes-compra", "detail", solicitacaoId],
    (old) => (old ? updater(old) : old),
  )
}

export function useSolicitacoesCompra(condominioId: string, filters?: ComprasFilters) {
  return useQuery({
    queryKey: ["solicitacoes-compra", condominioId, filters],
    queryFn: () => getSolicitacoesCompra(condominioId, filters),
    enabled: !!condominioId,
    placeholderData: keepPreviousData,
  })
}

export function useSolicitacaoCompra(id: string) {
  return useQuery({
    queryKey: ["solicitacoes-compra", "detail", id],
    queryFn: () => getSolicitacaoCompra(id),
    enabled: !!id,
  })
}

export function useCreateSolicitacaoCompra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSolicitacaoCompraRequest) => createSolicitacaoCompra(data),
    onSuccess: (solicitacao) => {
      upsertPaginatedItem<SolicitacaoCompra>(qc, ["solicitacoes-compra"], solicitacao, {
        prependIfMissing: true,
      })
      toast.success("Solicitação criada. Cadastre cotações em Cotações.")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao criar solicitação")),
  })
}

export function useAprovarSolicitacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aprovarSolicitacao(id),
    onSuccess: (solicitacao) => {
      syncSolicitacaoCompraCache(qc, solicitacao)
      toast.success("Solicitação aprovada")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao aprovar solicitação")),
  })
}

export function useUpdateStatusCompra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CompraStatus }) =>
      updateSolicitacaoStatus(id, status),
    onSuccess: (solicitacao) => {
      syncSolicitacaoCompraCache(qc, solicitacao)
      toast.success("Status atualizado")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao atualizar status")),
  })
}

export function useSelecionarCotacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      solicitacaoId,
      cotacaoId,
    }: {
      solicitacaoId: string
      cotacaoId: string
    }) => selecionarCotacao(solicitacaoId, cotacaoId),
    onMutate: async ({ solicitacaoId, cotacaoId }) => {
      const detailKey = ["solicitacoes-compra", "detail", solicitacaoId] as const
      await qc.cancelQueries({ queryKey: detailKey })

      const previous = qc.getQueryData<SolicitacaoCompra>(detailKey)
      if (previous) {
        qc.setQueryData(detailKey, patchCotacaoSelecionada(previous, cotacaoId))
      }

      patchPaginatedItem<SolicitacaoCompra>(qc, ["solicitacoes-compra"], solicitacaoId, (s) => ({
        ...s,
        temCotacaoSelecionada: true,
      }))

      return { previous, detailKey }
    },
    onSuccess: () => {
      toast.success("Cotação selecionada")
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(context.detailKey, context.previous)
      }
      toast.error(getApiErrorMessage(err, "Erro ao selecionar cotação"))
    },
  })
}

export function useCreateCotacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      solicitacaoId,
      data,
    }: {
      solicitacaoId: string
      data: CreateCotacaoRequest
    }) => createCotacao(solicitacaoId, data),
    onSuccess: (cotacao, { solicitacaoId }) => {
      patchSolicitacaoDetail(qc, solicitacaoId, (old) => ({
        ...old,
        totalCotacoes: old.totalCotacoes + 1,
        cotacoes: [...(old.cotacoes ?? []), cotacao],
      }))
      patchPaginatedItem<SolicitacaoCompra>(qc, ["solicitacoes-compra"], solicitacaoId, (s) => ({
        ...s,
        totalCotacoes: s.totalCotacoes + 1,
      }))
      toast.success("Cotação adicionada")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao adicionar cotação")),
  })
}

export function useUpdateCotacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      solicitacaoId,
      cotacaoId,
      data,
    }: {
      solicitacaoId: string
      cotacaoId: string
      data: CreateCotacaoRequest
    }) => updateCotacao(solicitacaoId, cotacaoId, data),
    onSuccess: (cotacao, { solicitacaoId }) => {
      patchSolicitacaoDetail(qc, solicitacaoId, (old) => ({
        ...old,
        cotacoes: (old.cotacoes ?? []).map((c) => (c.id === cotacao.id ? cotacao : c)),
      }))
      toast.success("Cotação atualizada")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao atualizar cotação")),
  })
}

export function useDeleteCotacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      solicitacaoId,
      cotacaoId,
    }: {
      solicitacaoId: string
      cotacaoId: string
    }) => deleteCotacao(solicitacaoId, cotacaoId),
    onSuccess: (_data, { solicitacaoId, cotacaoId }) => {
      patchSolicitacaoDetail(qc, solicitacaoId, (old) => {
        const cotacoes = (old.cotacoes ?? []).filter((c) => c.id !== cotacaoId)
        return {
          ...old,
          totalCotacoes: Math.max(0, old.totalCotacoes - 1),
          temCotacaoSelecionada: cotacoes.some((c) => c.selecionada),
          cotacoes,
        }
      })
      patchPaginatedItem<SolicitacaoCompra>(qc, ["solicitacoes-compra"], solicitacaoId, (s) => {
        const removed = s.cotacoes?.find((c) => c.id === cotacaoId)
        const cotacoes = (s.cotacoes ?? []).filter((c) => c.id !== cotacaoId)
        return {
          ...s,
          totalCotacoes: Math.max(0, s.totalCotacoes - 1),
          temCotacaoSelecionada: removed?.selecionada
            ? false
            : (s.temCotacaoSelecionada ?? cotacoes.some((c) => c.selecionada)),
        }
      })
      toast.success("Cotação removida")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao remover cotação")),
  })
}

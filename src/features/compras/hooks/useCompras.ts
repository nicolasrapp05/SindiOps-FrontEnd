import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getSolicitacoesCompra,
  getSolicitacaoCompra,
  createSolicitacaoCompra,
  aprovarSolicitacao,
  selecionarCotacao,
  createCotacao,
  updateCotacao,
  deleteCotacao,
} from "../services/compras.service"
import type {
  ComprasFilters,
  CreateSolicitacaoCompraRequest,
  CreateCotacaoRequest,
} from "../types/compra.types"

export function useSolicitacoesCompra(condominioId: string, filters?: ComprasFilters) {
  return useQuery({
    queryKey: ["solicitacoes-compra", condominioId, filters],
    queryFn: () => getSolicitacoesCompra(condominioId, filters),
    enabled: !!condominioId,
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
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["solicitacoes-compra", variables.condominioId] })
      toast.success("Solicitação criada com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar solicitação"),
  })
}

export function useAprovarSolicitacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aprovarSolicitacao(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["solicitacoes-compra"] })
      qc.invalidateQueries({ queryKey: ["solicitacoes-compra", "detail", id] })
      toast.success("Solicitação aprovada")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao aprovar solicitação"),
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
    onSuccess: (_data, { solicitacaoId }) => {
      qc.invalidateQueries({ queryKey: ["solicitacoes-compra"] })
      qc.invalidateQueries({ queryKey: ["solicitacoes-compra", "detail", solicitacaoId] })
      toast.success("Cotação selecionada")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao selecionar cotação"),
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
    onSuccess: (_data, { solicitacaoId }) => {
      qc.invalidateQueries({ queryKey: ["solicitacoes-compra", "detail", solicitacaoId] })
      qc.invalidateQueries({ queryKey: ["solicitacoes-compra"] })
      toast.success("Cotação adicionada")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar cotação"),
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
    onSuccess: (_data, { solicitacaoId }) => {
      qc.invalidateQueries({ queryKey: ["solicitacoes-compra", "detail", solicitacaoId] })
      qc.invalidateQueries({ queryKey: ["solicitacoes-compra"] })
      toast.success("Cotação atualizada")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar cotação"),
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
    onSuccess: (_data, { solicitacaoId }) => {
      qc.invalidateQueries({ queryKey: ["solicitacoes-compra", "detail", solicitacaoId] })
      qc.invalidateQueries({ queryKey: ["solicitacoes-compra"] })
      toast.success("Cotação removida")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao remover cotação"),
  })
}

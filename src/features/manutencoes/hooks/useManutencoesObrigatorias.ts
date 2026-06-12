import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getManutencoesObrigatorias,
  createManutencaoObrigatoria,
  updateManutencaoObrigatoria,
  realizarManutencao,
  deleteManutencaoObrigatoria,
} from "../services/manutencoes-obrigatorias.service"
import type {
  CreateManutencaoObrigatoriaRequest,
  ManutencaoFilters,
  RealizarManutencaoRequest,
} from "../types/manutencao-obrigatoria.types"

export function useManutencoesObrigatorias(
  condominioId: string,
  filters?: ManutencaoFilters,
) {
  return useQuery({
    queryKey: ["manutencoes-obrigatorias", condominioId, filters],
    queryFn: () => getManutencoesObrigatorias(condominioId, filters),
    enabled: !!condominioId,
    placeholderData: keepPreviousData,
  })
}

export function useCreateManutencaoObrigatoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateManutencaoObrigatoriaRequest) =>
      createManutencaoObrigatoria(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manutencoes-obrigatorias"] })
      toast.success("Manutenção cadastrada com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar manutenção"),
  })
}

export function useUpdateManutencaoObrigatoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateManutencaoObrigatoriaRequest }) =>
      updateManutencaoObrigatoria(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manutencoes-obrigatorias"] })
      toast.success("Manutenção atualizada com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar manutenção"),
  })
}

export function useRealizarManutencao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RealizarManutencaoRequest }) =>
      realizarManutencao(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manutencoes-obrigatorias"] })
      toast.success("Manutenção registrada com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao registrar realização"),
  })
}

export function useDeleteManutencaoObrigatoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteManutencaoObrigatoria(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manutencoes-obrigatorias"] })
      toast.success("Manutenção removida com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao remover manutenção"),
  })
}

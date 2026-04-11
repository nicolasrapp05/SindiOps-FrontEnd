import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getMoradores,
  getMorador,
  createMorador,
  updateMorador,
  deleteMorador,
} from "../services/moradores.service"
import type {
  CreateMoradorRequest,
  MoradoresFilters,
} from "../types/morador.types"

export function useMoradores(condominioId: string, filters?: MoradoresFilters) {
  return useQuery({
    queryKey: ["moradores", condominioId, filters],
    queryFn: () => getMoradores(condominioId, filters),
    enabled: !!condominioId,
  })
}

export function useMorador(id: string) {
  return useQuery({
    queryKey: ["moradores", "detail", id],
    queryFn: () => getMorador(id),
    enabled: !!id,
  })
}

export function useCreateMorador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMoradorRequest) => createMorador(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["moradores"] })
      toast.success("Morador cadastrado com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar morador"),
  })
}

export function useUpdateMorador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateMoradorRequest> }) =>
      updateMorador(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["moradores"] })
      toast.success("Morador atualizado com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar morador"),
  })
}

export function useDeleteMorador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMorador(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["moradores"] })
      toast.success("Morador removido com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao remover morador"),
  })
}

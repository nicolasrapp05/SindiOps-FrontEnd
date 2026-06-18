import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import {
  removePaginatedItem,
  setDetailCache,
  upsertPaginatedItem,
} from "@/lib/query-cache"
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
  Morador,
} from "../types/morador.types"

export function useMoradores(condominioId: string, filters?: MoradoresFilters) {
  return useQuery({
    queryKey: ["moradores", condominioId, filters],
    queryFn: () => getMoradores(condominioId, filters),
    enabled: !!condominioId,
    placeholderData: keepPreviousData,
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
    onSuccess: (morador) => {
      upsertPaginatedItem<Morador>(qc, ["moradores"], morador, { prependIfMissing: true })
      toast.success("Morador cadastrado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao cadastrar morador")),
  })
}

export function useUpdateMorador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateMoradorRequest> }) =>
      updateMorador(id, data),
    onSuccess: (morador) => {
      upsertPaginatedItem<Morador>(qc, ["moradores"], morador)
      setDetailCache(qc, ["moradores", "detail", morador.id], morador)
      toast.success("Morador atualizado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao atualizar morador")),
  })
}

export function useDeleteMorador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMorador(id),
    onSuccess: (_data, id) => {
      removePaginatedItem<Morador>(qc, ["moradores"], id)
      qc.removeQueries({ queryKey: ["moradores", "detail", id] })
      toast.success("Morador removido com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao remover morador")),
  })
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getCondominios,
  getCondominio,
  createCondominio,
  updateCondominio,
  deleteCondominio,
  getBlocos,
  createBloco,
  deleteBloco,
  updateBloco,
  createUnidade,
  updateUnidade,
  deleteUnidade,
} from "../services/condominios.service"
import type { CreateCondominioRequest } from "../types/condominio.types"

export function useCondominios() {
  return useQuery({
    queryKey: ["condominios"],
    queryFn: getCondominios,
    staleTime: 0,
  })
}

export function useCondominio(id: string) {
  return useQuery({
    queryKey: ["condominios", id],
    queryFn: () => getCondominio(id),
    enabled: !!id,
  })
}

export function useCreateCondominio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCondominioRequest) => createCondominio(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["condominios"] })
    },
  })
}

export function useUpdateCondominio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCondominioRequest }) =>
      updateCondominio(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["condominios"] })
      qc.invalidateQueries({ queryKey: ["condominios", variables.id] })
    },
  })
}

export function useDeleteCondominio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCondominio(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["condominios"] })
    },
  })
}

export function useBlocos(condominioId: string) {
  return useQuery({
    queryKey: ["condominios", condominioId, "blocos"],
    queryFn: () => getBlocos(condominioId),
    enabled: !!condominioId,
  })
}

export function useCreateBloco(condominioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (nome: string) => createBloco(condominioId, nome),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["condominios", condominioId, "blocos"] })
      qc.invalidateQueries({ queryKey: ["condominios"] })
    },
  })
}

export function useUpdateBloco(condominioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ blocoId, nome }: { blocoId: string; nome: string }) =>
      updateBloco(condominioId, blocoId, nome),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["condominios", condominioId, "blocos"] })
    },
  })
}

export function useDeleteBloco(condominioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (blocoId: string) => deleteBloco(condominioId, blocoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["condominios", condominioId, "blocos"] })
      qc.invalidateQueries({ queryKey: ["condominios"] })
    },
  })
}

export function useCreateUnidade(condominioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ blocoId, numero }: { blocoId: string; numero: string }) =>
      createUnidade(condominioId, blocoId, numero),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["condominios", condominioId, "blocos"] })
      qc.invalidateQueries({ queryKey: ["condominios"] })
    },
  })
}

export function useUpdateUnidade(condominioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      blocoId,
      unidadeId,
      numero,
    }: {
      blocoId: string
      unidadeId: string
      numero: string
    }) => updateUnidade(condominioId, blocoId, unidadeId, numero),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["condominios", condominioId, "blocos"] })
    },
  })
}

export function useDeleteUnidade(condominioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ blocoId, unidadeId }: { blocoId: string; unidadeId: string }) =>
      deleteUnidade(condominioId, blocoId, unidadeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["condominios", condominioId, "blocos"] })
      qc.invalidateQueries({ queryKey: ["condominios"] })
    },
  })
}

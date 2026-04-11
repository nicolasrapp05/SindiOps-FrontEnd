import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getCondominios,
  getCondominio,
  createCondominio,
  updateCondominio,
  deleteCondominio,
} from "../services/condominios.service"
import type { CreateCondominioRequest } from "../types/condominio.types"

export function useCondominios() {
  return useQuery({
    queryKey: ["condominios"],
    queryFn: getCondominios,
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

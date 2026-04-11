import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getContratos,
  getContrato,
  createContrato,
  updateContrato,
  updateContratoStatus,
} from "../services/contratos.service"
import type { ContratoStatus, ContratosFilters, CreateContratoRequest } from "../types/contrato.types"

export function useContratos(condominioId: string, filters?: ContratosFilters) {
  return useQuery({
    queryKey: ["contratos", condominioId, filters],
    queryFn: () => getContratos(condominioId, filters),
    enabled: !!condominioId,
  })
}

export function useContrato(id: string) {
  return useQuery({
    queryKey: ["contratos", "detail", id],
    queryFn: () => getContrato(id),
    enabled: !!id,
  })
}

export function useCreateContrato() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateContratoRequest) => createContrato(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos"] })
      toast.success("Contrato cadastrado com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar contrato"),
  })
}

export function useUpdateContrato() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateContratoRequest }) =>
      updateContrato(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos"] })
      toast.success("Contrato atualizado com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar contrato"),
  })
}

export function useUpdateContratoStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContratoStatus }) =>
      updateContratoStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos"] })
      toast.success("Status do contrato atualizado")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status"),
  })
}

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import {
  setDetailCache,
  upsertPaginatedItem,
} from "@/lib/query-cache"
import {
  getContratos,
  getContrato,
  createContrato,
  updateContrato,
  updateContratoStatus,
} from "../services/contratos.service"
import type { Contrato, ContratoStatus, ContratosFilters, CreateContratoRequest } from "../types/contrato.types"

export function useContratos(condominioId: string, filters?: ContratosFilters) {
  return useQuery({
    queryKey: ["contratos", condominioId, filters],
    queryFn: () => getContratos(condominioId, filters),
    enabled: !!condominioId,
    placeholderData: keepPreviousData,
  })
}

/** Busca contratos sem escopo de condomínio — retorna todos os contratos do síndico. */
export function useContratosGlobais(filters?: ContratosFilters) {
  return useQuery({
    queryKey: ["contratos", "globais", filters],
    queryFn: () => getContratos(undefined, filters),
    placeholderData: keepPreviousData,
  })
}

/** Busca contratos de um fornecedor específico (sem escopo de condomínio). */
export function useContratosPorFornecedor(fornecedorId: string) {
  return useQuery({
    queryKey: ["contratos", "by-fornecedor", fornecedorId],
    queryFn: () => getContratos(undefined, { fornecedorId, pageSize: 50 }),
    enabled: !!fornecedorId,
  })
}

export function useContrato(id: string) {
  return useQuery({
    queryKey: ["contratos", "detail", id],
    queryFn: () => getContrato(id),
    enabled: !!id,
  })
}

function syncContratoCache(qc: ReturnType<typeof useQueryClient>, contrato: Contrato) {
  upsertPaginatedItem<Contrato>(qc, ["contratos"], contrato, { prependIfMissing: true })
  setDetailCache(qc, ["contratos", "detail", contrato.id], contrato)
}

export function useCreateContrato() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateContratoRequest) => createContrato(data),
    onSuccess: (contrato) => {
      syncContratoCache(qc, contrato)
      toast.success("Contrato cadastrado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao cadastrar contrato")),
  })
}

export function useUpdateContrato() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateContratoRequest }) =>
      updateContrato(id, data),
    onSuccess: (contrato) => {
      syncContratoCache(qc, contrato)
      toast.success("Contrato atualizado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao atualizar contrato")),
  })
}

export function useUpdateContratoStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContratoStatus }) =>
      updateContratoStatus(id, status),
    onSuccess: (contrato) => {
      syncContratoCache(qc, contrato)
      toast.success("Status do contrato atualizado")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao atualizar status")),
  })
}

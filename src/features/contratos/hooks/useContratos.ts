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
  cancelarContrato,
  reativarContrato,
} from "../services/contratos.service"
import type { Contrato, ContratosFilters, CreateContratoRequest } from "../types/contrato.types"
import { CONTRATO_STATUS_LABEL } from "../lib/contrato-status"
import { condominioIdDaConsulta, escopoCondominioAtivo } from "@/lib/condominio-scope"

export function useContratos(escopoId: string | null, filters?: ContratosFilters) {
  return useQuery({
    queryKey: ["contratos", escopoId, filters],
    queryFn: () => getContratos(condominioIdDaConsulta(escopoId), filters),
    enabled: escopoCondominioAtivo(escopoId),
    placeholderData: keepPreviousData,
  })
}

/** Contratos da carteira acessível, sem recorte de um condomínio. */
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

export function useCancelarContrato() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelarContrato(id),
    onSuccess: (contrato) => {
      syncContratoCache(qc, contrato)
      toast.success("Contrato cancelado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao cancelar contrato")),
  })
}

export function useReativarContrato() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reativarContrato(id),
    onSuccess: (contrato) => {
      syncContratoCache(qc, contrato)
      toast.success(
        `Contrato reativado — status: ${CONTRATO_STATUS_LABEL[contrato.status]}`,
      )
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao reativar contrato")),
  })
}

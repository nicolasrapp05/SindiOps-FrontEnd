import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getOcorrencias,
  getOcorrencia,
  createOcorrencia,
  updateOcorrenciaStatus,
  uploadMidia,
  enviarComunicacao,
} from "../services/ocorrencias.service"
import type { CreateOcorrenciaRequest, OcorrenciasFilters, OcorrenciaStatus } from "../types/ocorrencia.types"
import type { EnviarComunicacaoRequest } from "../types/comunicacao.types"

export function useOcorrencias(condominioId: string, filters?: OcorrenciasFilters) {
  return useQuery({
    queryKey: ["ocorrencias", condominioId, filters],
    queryFn: () => getOcorrencias(condominioId, filters),
    enabled: !!condominioId,
    placeholderData: keepPreviousData,
  })
}

export function useOcorrencia(id: string) {
  return useQuery({
    queryKey: ["ocorrencias", "detail", id],
    queryFn: () => getOcorrencia(id),
    enabled: !!id,
  })
}

export function useCreateOcorrencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOcorrenciaRequest) => createOcorrencia(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ocorrencias"] })
      toast.success("Ocorrência registrada com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao registrar ocorrência"),
  })
}

export function useUpdateOcorrenciaStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OcorrenciaStatus }) =>
      updateOcorrenciaStatus(id, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["ocorrencias"] })
      qc.invalidateQueries({ queryKey: ["ocorrencias", "detail", v.id] })
      toast.success("Status atualizado com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status"),
  })
}

export function useUploadMidia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ocorrenciaId, arquivo, tipo }: { ocorrenciaId: string; arquivo: File; tipo: "image" | "video" }) =>
      uploadMidia(ocorrenciaId, arquivo, tipo),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["ocorrencias", "detail", v.ocorrenciaId] })
      toast.success("Mídia enviada com sucesso")
    },
    onError: () => toast.error("Erro ao enviar mídia"),
  })
}

export function useEnviarComunicacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ocorrenciaId, data }: { ocorrenciaId: string; data: EnviarComunicacaoRequest }) =>
      enviarComunicacao(ocorrenciaId, data),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["ocorrencias", "detail", v.ocorrenciaId] })
      toast.success("Email enviado com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao enviar comunicação"),
  })
}

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import {
  patchDetailCache,
  setDetailCache,
  upsertPaginatedItem,
} from "@/lib/query-cache"
import {
  getOcorrencias,
  getOcorrencia,
  createOcorrencia,
  updateOcorrencia,
  updateOcorrenciaStatus,
  uploadMidia,
  enviarComunicacao,
} from "../services/ocorrencias.service"
import type { CreateOcorrenciaRequest, OcorrenciasFilters, Ocorrencia, OcorrenciaStatus, MidiaOcorrencia } from "../types/ocorrencia.types"
import type { EnviarComunicacaoRequest } from "../types/comunicacao.types"
import type { ApiResponse } from "@/types"
import { condominioIdDaConsulta, escopoCondominioAtivo } from "@/lib/condominio-scope"

export function useOcorrencias(escopoId: string | null, filters?: OcorrenciasFilters) {
  return useQuery({
    queryKey: ["ocorrencias", escopoId, filters],
    queryFn: () => getOcorrencias(condominioIdDaConsulta(escopoId), filters),
    enabled: escopoCondominioAtivo(escopoId),
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

function syncOcorrenciaCache(qc: ReturnType<typeof useQueryClient>, ocorrencia: Ocorrencia) {
  upsertPaginatedItem<Ocorrencia>(qc, ["ocorrencias"], ocorrencia, { prependIfMissing: true })
  setDetailCache(qc, ["ocorrencias", "detail", ocorrencia.id], ocorrencia)
}

export function useCreateOcorrencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOcorrenciaRequest) => createOcorrencia(data),
    onSuccess: (ocorrencia) => {
      syncOcorrenciaCache(qc, ocorrencia)
      toast.success("Ocorrência registrada com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao registrar ocorrência")),
  })
}

export function useUpdateOcorrencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateOcorrenciaRequest }) =>
      updateOcorrencia(id, data),
    onSuccess: (ocorrencia) => {
      upsertPaginatedItem<Ocorrencia>(qc, ["ocorrencias"], ocorrencia)
      qc.invalidateQueries({ queryKey: ["ocorrencias", "detail", ocorrencia.id] })
      toast.success("Ocorrência atualizada com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao atualizar ocorrência")),
  })
}

export function useUpdateOcorrenciaStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OcorrenciaStatus }) =>
      updateOcorrenciaStatus(id, status),
    onSuccess: (ocorrencia) => {
      syncOcorrenciaCache(qc, ocorrencia)
      toast.success("Status atualizado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao atualizar status")),
  })
}

export function useUploadMidia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ocorrenciaId, arquivo, tipo }: { ocorrenciaId: string; arquivo: File; tipo: "image" | "video" }) =>
      uploadMidia(ocorrenciaId, arquivo, tipo),
    onSuccess: (response, v) => {
      const midia =
        (response as ApiResponse<MidiaOcorrencia>)?.data ??
        (response as MidiaOcorrencia)
      if (midia?.id) {
        patchDetailCache<Ocorrencia>(qc, ["ocorrencias", "detail", v.ocorrenciaId], (old) => {
          if (!old) return old
          return {
            ...old,
            midias: [...(old.midias ?? []), midia],
            totalMidias: (old.totalMidias ?? old.midias?.length ?? 0) + 1,
          }
        })
      }
      toast.success("Mídia enviada com sucesso")
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao enviar mídia")),
  })
}

export function useEnviarComunicacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ocorrenciaId, data }: { ocorrenciaId: string; data: EnviarComunicacaoRequest }) =>
      enviarComunicacao(ocorrenciaId, data),
    onSuccess: (data, { ocorrenciaId }) => {
      qc.invalidateQueries({ queryKey: ["email-logs"] })
      qc.invalidateQueries({ queryKey: ["ocorrencias", "detail", ocorrenciaId] })
      const copia = data.copiaProprietario
      if (!copia) {
        toast.success("Email enviado com sucesso")
      } else if (copia.statusEntrega === "failed") {
        toast.warning("E-mail enviado ao morador, mas a cópia ao proprietário falhou")
      } else {
        toast.success("E-mail enviado ao morador e ao proprietário")
      }
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao enviar comunicação")),
  })
}

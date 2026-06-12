import { getPaginated, post, put, patch, del } from "@/lib/api"
import api from "@/lib/axios"
import type {
  Ocorrencia,
  CreateOcorrenciaRequest,
  OcorrenciasFilters,
  OcorrenciaStatus,
} from "../types/ocorrencia.types"
import type {
  EnviarComunicacaoRequest,
  ComunicacaoResponse,
} from "../types/comunicacao.types"

export function getOcorrencias(condominioId: string, filters?: OcorrenciasFilters) {
  return getPaginated<Ocorrencia>("/ocorrencias", { condominioId, ...filters })
}

export function getOcorrencia(id: string) {
  return get<Ocorrencia>(`/ocorrencias/${id}`)
}

export function createOcorrencia(data: CreateOcorrenciaRequest) {
  return post<Ocorrencia>("/ocorrencias", data)
}

export function updateOcorrencia(id: string, data: Partial<CreateOcorrenciaRequest>) {
  return put<Ocorrencia>(`/ocorrencias/${id}`, data)
}

export function updateOcorrenciaStatus(id: string, status: OcorrenciaStatus) {
  return patch<Ocorrencia>(`/ocorrencias/${id}/status`, { status })
}

export async function uploadMidia(
  ocorrenciaId: string,
  arquivo: File,
  tipo: "image" | "video",
) {
  const formData = new FormData()
  formData.append("arquivo", arquivo)
  formData.append("tipo", tipo)
  const response = await api.post(`/ocorrencias/${ocorrenciaId}/midias`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data
}

export function deleteMidia(ocorrenciaId: string, midiaId: string) {
  return del<null>(`/ocorrencias/${ocorrenciaId}/midias/${midiaId}`)
}

export function enviarComunicacao(ocorrenciaId: string, data: EnviarComunicacaoRequest) {
  return post<ComunicacaoResponse>(`/ocorrencias/${ocorrenciaId}/comunicacoes`, data)
}

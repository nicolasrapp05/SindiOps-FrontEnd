export type StatusEntrega = "sent" | "delivered" | "failed"

export interface EmailLog {
  id: string
  assunto: string
  emailDestinatario: string
  morador: { id: string; nome: string }
  ocorrencia?: { id: string; tipoOcorrencia: string }
  template?: { id: string; nome: string; tipo: string }
  statusEntrega: StatusEntrega
  enviadoEm: string
  enviadoPor: { id: string; nome: string }
  corpoResolvido?: string
}

export interface EmailLogFilters {
  condominioId?: string
  moradorId?: string
  ocorrenciaId?: string
  statusEntrega?: StatusEntrega
  dataInicio?: string
  dataFim?: string
  page?: number
  pageSize?: number
}

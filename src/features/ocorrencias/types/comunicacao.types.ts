export interface EnviarComunicacaoRequest {
  templateId: string
  moradorId: string
  assuntoEditado: string
  corpoEditado: string
  valorMulta?: number
  prazoResposta?: string
}

export interface ComunicacaoResponse {
  id: string
  emailDestinatario: string
  assunto: string
  statusEntrega: "sent" | "delivered" | "failed"
  enviadoEm: string
}

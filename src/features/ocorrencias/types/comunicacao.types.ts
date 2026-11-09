export interface EnviarComunicacaoRequest {
  templateId: string
  moradorId: string
  assuntoEditado: string
  corpoEditado: string
  valorMulta?: number
  prazoResposta?: string
  enviarCopiaProprietario?: boolean
}

export interface ComunicacaoEnvio {
  id: string
  emailDestinatario: string
  assunto: string
  statusEntrega: "sent" | "delivered" | "failed"
  enviadoEm: string
}

export interface ComunicacaoResponse extends ComunicacaoEnvio {
  copiaProprietario?: ComunicacaoEnvio | null
}

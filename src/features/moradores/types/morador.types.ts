export interface Morador {
  id: string
  condominioId: string
  unidadeId: string
  nome: string
  email: string
  telefone?: string
  bloco: { id: string; nome: string }
  unidade: { id: string; numero: string }
  criadoEm: string
  ultimosEmails?: EmailResumo[]
}

export interface EmailResumo {
  id: string
  assunto: string
  enviadoEm: string
  statusEntrega: "sent" | "delivered" | "failed"
}

export interface CreateMoradorRequest {
  condominioId: string
  unidadeId: string
  nome: string
  email: string
  telefone?: string
}

export interface MoradoresFilters {
  blocoId?: string
  unidadeId?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface MoradoresListResponse {
  data: Morador[]
  nextCursor: string | null
  totalCount: number
  pageSize: number
}

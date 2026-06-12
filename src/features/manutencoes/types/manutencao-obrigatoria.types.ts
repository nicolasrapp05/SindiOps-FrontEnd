export type ManutencaoStatus = "ok" | "upcoming" | "overdue"

export type ManutencaoTipo =
  | "dedetizacao"
  | "para_raios"
  | "seguro"
  | "limpeza_caixa_agua"
  | "caixa_gordura_esgoto"
  | "extintores"
  | "cvcb"
  | "calhas_telhado"
  | "ppra"
  | "pcmso"
  | "pgr"

export const MANUTENCAO_TIPO_LABEL: Record<ManutencaoTipo, string> = {
  dedetizacao: "Dedetização",
  para_raios: "Para-raios",
  seguro: "Seguro",
  limpeza_caixa_agua: "Limpeza Caixa d\u2019Água",
  caixa_gordura_esgoto: "Caixa Gordura/Esgoto",
  extintores: "Extintores",
  cvcb: "CVCB (Bombeiros)",
  calhas_telhado: "Calhas e Telhado",
  ppra: "PPRA",
  pcmso: "PCMSO",
  pgr: "PGR",
}

export interface ManutencaoObrigatoria {
  id: string
  tipo: ManutencaoTipo
  dataVencimento: string
  ultimaRealizacao?: string
  status: ManutencaoStatus
  observacoes?: string
  condominio: { id: string; nome: string }
}

export interface CreateManutencaoObrigatoriaRequest {
  condominioId: string
  tipo: ManutencaoTipo
  dataVencimento: string
  ultimaRealizacao?: string
  observacoes?: string
}

export interface RealizarManutencaoRequest {
  dataRealizacao: string
  observacoes?: string
}

export interface ManutencaoFilters {
  search?: string
  status?: ManutencaoStatus
  tipo?: ManutencaoTipo
  page?: number
  pageSize?: number
}

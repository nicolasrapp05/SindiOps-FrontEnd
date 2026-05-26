export type SolicitacaoStatus = "nova" | "em_andamento" | "finalizada" | "cancelada"

export type SolicitacaoTipoServico =
  | "obra_civil"
  | "pintura"
  | "serralheria"
  | "eletrica"
  | "hidraulica"
  | "cameras"
  | "portas_portoes"
  | "jardim"
  | "esgoto"
  | "caixa_gordura"
  | "outro"

export const SOLICITACAO_TIPO_LABEL: Record<SolicitacaoTipoServico, string> = {
  obra_civil: "Obra Civil",
  pintura: "Pintura",
  serralheria: "Serralheria",
  eletrica: "Elétrica",
  hidraulica: "Hidráulica",
  cameras: "Câmeras",
  portas_portoes: "Portas e Portões",
  jardim: "Jardim",
  esgoto: "Esgoto",
  caixa_gordura: "Caixa de Gordura",
  outro: "Outro",
}

export interface SolicitacaoManutencao {
  id: string
  condominioId: string
  tipoServico: SolicitacaoTipoServico
  local: string
  responsavel: "fornecedor" | "zelador"
  descricao?: string
  status: SolicitacaoStatus
  dataConclusao?: string
  fornecedor?: { id: string; nome: string }
  registradoPor: { id: string; nome: string }
  criadoEm: string
}

export interface CreateSolicitacaoManutencaoRequest {
  condominioId: string
  tipoServico: SolicitacaoTipoServico
  local: string
  responsavel: "fornecedor" | "zelador"
  descricao?: string
  fornecedorId?: string
}

export interface SolicitacaoFilters {
  status?: SolicitacaoStatus
  tipoServico?: SolicitacaoTipoServico
  responsavel?: "fornecedor" | "zelador"
  page?: number
  pageSize?: number
}

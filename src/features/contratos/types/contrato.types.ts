export type ContratoStatus = "active" | "expiring" | "expired" | "cancelled"

export type TipoServico =
  | "administradora"
  | "garantidora"
  | "gas"
  | "telefonia"
  | "internet"
  | "terceirizada"
  | "juridico"
  | "manutencao_elevador"
  | "manutencao_jardim"
  | "gestao_residuos"
  | "outro"

export const TIPO_SERVICO_LABEL: Record<TipoServico, string> = {
  administradora: "Administradora",
  garantidora: "Garantidora",
  gas: "Gás",
  telefonia: "Telefonia",
  internet: "Internet",
  terceirizada: "Terceirizada",
  juridico: "Jurídico",
  manutencao_elevador: "Manutenção Elevador",
  manutencao_jardim: "Manutenção Jardim",
  gestao_residuos: "Gestão de Resíduos",
  outro: "Outro",
}

export interface Contrato {
  id: string
  condominioId: string
  fornecedor: { id: string; nome: string }
  tipoServico: TipoServico
  nomeContato?: string
  telefoneContato?: string
  dataInicio?: string
  dataFim?: string
  valorMensal?: number
  indiceReajuste?: string
  condicoesRenovacao?: string
  condicoesRescisao?: string
  status: ContratoStatus
  criadoEm: string
}

export interface CreateContratoRequest {
  condominioId: string
  fornecedorId: string
  tipoServico: TipoServico
  nomeContato?: string
  telefoneContato?: string
  dataInicio?: string
  dataFim?: string
  valorMensal?: number
  indiceReajuste?: string
  condicoesRenovacao?: string
  condicoesRescisao?: string
}

export interface ContratosFilters {
  fornecedorId?: string
  status?: ContratoStatus
  page?: number
  pageSize?: number
  search?: string
}

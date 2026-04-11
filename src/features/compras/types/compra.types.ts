export type CompraStatus = "nova" | "em_andamento" | "finalizada" | "cancelada"
export type CompraCategoria = "papelaria" | "mat_construcao" | "mat_limpeza" | "mat_especifico"
export type TipoAprovacao = "sindico" | "conselho" | "assembleia"

export const COMPRA_CATEGORIA_LABEL: Record<CompraCategoria, string> = {
  papelaria: "Papelaria",
  mat_construcao: "Material de Construção",
  mat_limpeza: "Material de Limpeza",
  mat_especifico: "Material Específico",
}

export interface Cotacao {
  id: string
  nomeEmpresa?: string
  nomeContato?: string
  nomeResponsavel?: string
  valorUnitario: number
  valorTotal: number
  formaPagamento?: string
  descricaoProduto?: string
  quantidade?: number
  unidade?: string
  selecionada: boolean
  fornecedor?: { id: string; nome: string }
}

export interface SolicitacaoCompra {
  id: string
  condominioId: string
  categoria: CompraCategoria
  item: string
  quantidade: number
  eReposicao: boolean
  justificativa?: string
  tipoAprovacao: TipoAprovacao
  status: CompraStatus
  aprovadoPor?: { id: string; nome: string }
  solicitadoPor: { id: string; nome: string }
  cotacoes?: Cotacao[]
  criadoEm: string
}

export interface CreateSolicitacaoCompraRequest {
  condominioId: string
  categoria: CompraCategoria
  item: string
  quantidade: number
  eReposicao?: boolean
  justificativa?: string
  tipoAprovacao: TipoAprovacao
}

export interface CreateCotacaoRequest {
  fornecedorId?: string
  nomeEmpresa?: string
  nomeContato?: string
  nomeResponsavel?: string
  valorUnitario: number
  valorTotal: number
  formaPagamento?: string
  descricaoProduto?: string
  quantidade?: number
  unidade?: string
}

export interface ComprasFilters {
  status?: CompraStatus
  categoria?: CompraCategoria
  page?: number
  pageSize?: number
}

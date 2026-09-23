export type CompraStatus = "nova" | "em_andamento" | "finalizada" | "cancelada"
export type CompraCategoria = "papelaria" | "mat_construcao" | "mat_limpeza" | "mat_especifico"
export type TipoAprovacao = "sindico" | "conselho" | "assembleia"

export const COMPRA_CATEGORIA_LABEL: Record<CompraCategoria, string> = {
  papelaria: "Papelaria",
  mat_construcao: "Material de Construção",
  mat_limpeza: "Material de Limpeza",
  mat_especifico: "Material Específico",
}

export interface SolicitacaoCompraItem {
  id: string
  categoria: CompraCategoria
  descricao: string
  quantidade: number
  unidade?: string
  eReposicao: boolean
}

export interface CotacaoItem {
  id: string
  itemId: string
  valorUnitario: number
  valorTotal: number
}

export interface Cotacao {
  id: string
  nomeEmpresa?: string
  nomeContato?: string
  nomeResponsavel?: string
  formaPagamento?: string
  valorTotal: number
  selecionada: boolean
  fornecedor?: { id: string; nome: string }
  itens: CotacaoItem[]
}

export interface SolicitacaoCompra {
  id: string
  condominioId?: string
  itens: SolicitacaoCompraItem[]
  justificativa?: string
  tipoAprovacao: TipoAprovacao
  status: CompraStatus
  aprovadoPor?: { id: string; nome: string }
  solicitadoPor: { id: string; nome: string; cargo?: string }
  totalCotacoes: number
  temCotacaoSelecionada?: boolean
  cotacoes?: Cotacao[]
  criadoEm: string
}

export interface CreateSolicitacaoCompraItemRequest {
  categoria: CompraCategoria
  descricao: string
  quantidade: number
  unidade?: string
  eReposicao?: boolean
}

export interface CreateSolicitacaoCompraRequest {
  condominioId: string
  itens: CreateSolicitacaoCompraItemRequest[]
  justificativa?: string
  tipoAprovacao: TipoAprovacao
}

export interface CreateCotacaoItemRequest {
  itemId: string
  valorUnitario: number
}

export interface CreateCotacaoRequest {
  fornecedorId?: string
  nomeEmpresa?: string
  nomeContato?: string
  nomeResponsavel?: string
  formaPagamento?: string
  itens: CreateCotacaoItemRequest[]
}

export interface ComprasFilters {
  search?: string
  status?: CompraStatus
  categoria?: CompraCategoria
  page?: number
  pageSize?: number
}

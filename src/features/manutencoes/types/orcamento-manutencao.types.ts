export interface OrcamentoManutencao {
  id: string
  nomeEmpresa?: string
  nomeContato?: string
  nomeResponsavel?: string
  formaPagamento?: string
  descricaoEscopo?: string
  valor: number
  prazoExecucaoDias?: number
  validadeProposta?: string
  garantia?: string
  observacoes?: string
  selecionada: boolean
  criadoEm: string
  fornecedor?: { id: string; nome: string }
}

export interface CreateOrcamentoManutencaoRequest {
  fornecedorId?: string
  nomeEmpresa?: string
  nomeContato?: string
  nomeResponsavel?: string
  formaPagamento?: string
  descricaoEscopo?: string
  valor: number
  prazoExecucaoDias?: number
  validadeProposta?: string
  garantia?: string
  observacoes?: string
}

export function nomeOrcamento(orcamento: Pick<OrcamentoManutencao, "nomeEmpresa" | "fornecedor">) {
  return orcamento.nomeEmpresa || orcamento.fornecedor?.nome || "Proposta sem nome"
}

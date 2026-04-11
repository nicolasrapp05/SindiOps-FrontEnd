export interface ServicoFornecedor {
  id: string
  tipo: string
  descricao?: string
  quantidade?: number
}

export interface Fornecedor {
  id: string
  nome: string
  cnpj?: string
  enderecoRua?: string
  enderecoNumero?: string
  enderecoBairro?: string
  enderecoCidade?: string
  enderecoCep?: string
  telefone?: string
  email?: string
  instagram?: string
  website?: string
  nomeContato?: string
  /** Presente na listagem apenas se a API enviar; detalhe traz a lista completa. */
  servicos?: ServicoFornecedor[]
  criadoEm: string
}

export interface CreateFornecedorRequest {
  nome: string
  cnpj?: string
  enderecoRua?: string
  enderecoNumero?: string
  enderecoBairro?: string
  enderecoCidade?: string
  enderecoCep?: string
  telefone?: string
  email?: string
  instagram?: string
  website?: string
  nomeContato?: string
  servicos?: { tipo: string; descricao?: string; quantidade?: number }[]
}

export interface FornecedoresFilters {
  search?: string
  page?: number
  pageSize?: number
}

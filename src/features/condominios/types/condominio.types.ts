export interface Unidade {
  id: string
  numero: string
}

export interface Bloco {
  id: string
  nome: string
  unidades: Unidade[]
}

export interface Condominio {
  id: string
  nome: string
  enderecoRua: string
  enderecoNumero: string
  enderecoBairro: string
  enderecoCidade: string
  enderecoCep: string
  dataEleicao: string
  vencimentoMandato: string
  totalBlocos: number
  totalUnidades: number
  status?: "vigente" | "expirando"
  blocos?: Bloco[]
  criadoEm: string
}

export type PadraoNumeracao = "andar100" | "sequencial" | "prefixoBloco" | "letras"
export type IdentificacaoBloco = "letras" | "numeros" | "custom"

export interface CreateCondominioRequest {
  nome: string
  enderecoRua?: string
  enderecoNumero?: string
  enderecoBairro?: string
  enderecoCidade?: string
  enderecoCep?: string
  dataEleicao?: string
  vencimentoMandato?: string
}

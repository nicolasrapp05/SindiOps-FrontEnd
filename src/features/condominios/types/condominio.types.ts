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
  status?: "vigente" | "expirando" | "vencido"
  blocos?: Bloco[]
  criadoEm: string
}

export type PadraoNumeracao = "personalizado" | "sequencial" | "prefixoBloco" | "letras"
export type IdentificacaoBloco = "letras" | "numeros" | "custom"

export interface CustomPatternConfig {
  prefix: string
  incluirAndar: boolean
  andarFormato: "raw" | "padded"
  andarDigitos: number
  separador: string
  seqFormato: "raw" | "padded"
  seqDigitos: number
  suffix: string
}

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

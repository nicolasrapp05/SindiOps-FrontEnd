export type FuncionarioCargo = "zelador" | "secretario" | "porteiro" | "outro"

export const CARGO_LABEL: Record<FuncionarioCargo, string> = {
  zelador: "Zelador",
  secretario: "Secretário(a)",
  porteiro: "Porteiro",
  outro: "Outro",
}

export interface Funcionario {
  id: string
  nome: string
  email: string
  cargo: FuncionarioCargo
  ativo: boolean
  criadoEm: string
  condominios?: { id: string; nome: string }[]
  conviteEnviado?: boolean
  convitePendente?: boolean
}

export interface ConvidarFuncionarioRequest {
  nome: string
  email: string
  cargo: FuncionarioCargo
  condominioIds: string[]
}

export interface FuncionarioFilters {
  cargo?: FuncionarioCargo
  ativo?: boolean
}

export interface CadastroSindicoRequest {
  nome: string
  email: string
  senha: string
  confirmarSenha: string
}

export interface CadastroSindicoResponse {
  id: string
  nome: string
  email: string
}

export interface EsqueciSenhaRequest {
  email: string
}

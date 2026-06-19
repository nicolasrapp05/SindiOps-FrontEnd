import { post } from "@/lib/api"
import type {
  CadastroSindicoRequest,
  CadastroSindicoResponse,
  EsqueciSenhaRequest,
} from "../types/auth.types"

export function cadastroSindico(data: CadastroSindicoRequest): Promise<CadastroSindicoResponse> {
  return post<CadastroSindicoResponse>("/auth/cadastro-sindico", data)
}

export function esqueciSenha(data: EsqueciSenhaRequest): Promise<void> {
  return post<void>("/auth/esqueci-senha", data)
}

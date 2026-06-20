import { get, post, put, patch } from "@/lib/api"
import type {
  Funcionario,
  ConvidarFuncionarioRequest,
  FuncionarioFilters,
} from "../types/funcionario.types"

export function getFuncionarios(filters?: FuncionarioFilters) {
  return get<Funcionario[]>("/funcionarios", filters)
}

export function convidarFuncionario(data: ConvidarFuncionarioRequest) {
  return post<Funcionario>("/funcionarios/convidar", data)
}

export function updateFuncionario(
  id: string,
  data: Partial<ConvidarFuncionarioRequest>,
) {
  return put<Funcionario>(`/funcionarios/${id}`, data)
}

export function ativarFuncionario(id: string) {
  return patch<Funcionario>(`/funcionarios/${id}/ativar`, {})
}

export function desativarFuncionario(id: string) {
  return patch<Funcionario>(`/funcionarios/${id}/desativar`, {})
}

export function reenviarConviteFuncionario(id: string) {
  return post<Funcionario>(`/funcionarios/${id}/reenviar-convite`, {})
}

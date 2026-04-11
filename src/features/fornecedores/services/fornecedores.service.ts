import { get, post, put, del } from "@/lib/api"
import type {
  Fornecedor,
  CreateFornecedorRequest,
  FornecedoresFilters,
} from "../types/fornecedor.types"

export function getFornecedores(filters?: FornecedoresFilters) {
  return get<Fornecedor[]>("/fornecedores", filters)
}

export function getFornecedor(id: string) {
  return get<Fornecedor>(`/fornecedores/${id}`)
}

export function createFornecedor(data: CreateFornecedorRequest) {
  return post<Fornecedor>("/fornecedores", data)
}

export function updateFornecedor(id: string, data: CreateFornecedorRequest) {
  return put<Fornecedor>(`/fornecedores/${id}`, data)
}

export function deleteFornecedor(id: string) {
  return del<null>(`/fornecedores/${id}`)
}

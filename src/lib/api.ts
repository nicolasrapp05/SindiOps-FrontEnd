import api from "./axios"
import type { ApiResponse } from "@/types"

function unwrap<T>(envelope: ApiResponse<T>): T {
  if (envelope.success) {
    return envelope.data
  }

  if (envelope.errors?.length) {
    throw new Error(envelope.errors[0].message)
  }

  throw new Error(envelope.message ?? "Erro desconhecido")
}

export async function get<T>(url: string, params?: object): Promise<T> {
  const response = await api.get<ApiResponse<T>>(url, { params })
  return unwrap(response.data)
}

export async function post<T>(url: string, body?: object): Promise<T> {
  const response = await api.post<ApiResponse<T>>(url, body)
  return unwrap(response.data)
}

export async function put<T>(url: string, body?: object): Promise<T> {
  const response = await api.put<ApiResponse<T>>(url, body)
  return unwrap(response.data)
}

export async function patch<T>(url: string, body?: object): Promise<T> {
  const response = await api.patch<ApiResponse<T>>(url, body)
  return unwrap(response.data)
}

export async function del<T>(url: string): Promise<T> {
  const response = await api.delete<ApiResponse<T>>(url)
  return unwrap(response.data)
}

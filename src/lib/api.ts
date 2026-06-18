import axios from "axios"
import api from "./axios"
import type { ApiResponse, ApiError, PaginatedResponse } from "@/types"

function firstValidationMessage(errors: unknown): string | undefined {
  if (!errors) return undefined

  if (Array.isArray(errors)) {
    const first = errors[0] as ApiError | string | undefined
    if (typeof first === "string") return first
    if (first && typeof first === "object" && "message" in first && first.message) {
      return String(first.message)
    }
    return undefined
  }

  if (typeof errors === "object") {
    for (const messages of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(messages) && messages.length > 0) {
        return String(messages[0])
      }
      if (typeof messages === "string" && messages) {
        return messages
      }
    }
  }

  return undefined
}

function extractApiErrorBody(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined

  const body = data as Record<string, unknown>
  const fromErrors = firstValidationMessage(body.errors)
  if (fromErrors) return fromErrors

  if (typeof body.detail === "string" && body.detail) return body.detail
  if (typeof body.message === "string" && body.message) return body.message

  const title = typeof body.title === "string" ? body.title : undefined
  if (title && title !== "One or more validation errors occurred.") {
    return title
  }

  return undefined
}

function isGenericAxiosMessage(message: string): boolean {
  return /^Request failed with status code \d+$/.test(message)
}

function unwrap<T>(envelope: ApiResponse<T>): T {
  if (envelope.success) {
    return envelope.data
  }

  if (envelope.errors?.length) {
    throw new Error(envelope.errors[0].message)
  }

  throw new Error(envelope.message ?? "Erro desconhecido")
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const fromBody = extractApiErrorBody(error.response?.data)
    if (fromBody) return fromBody
  }

  if (
    error instanceof Error &&
    error.message &&
    !isGenericAxiosMessage(error.message)
  ) {
    return error.message
  }

  return fallback
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

export async function getPaginated<T>(url: string, params?: object): Promise<PaginatedResponse<T>> {
  const response = await api.get<PaginatedResponse<T>>(url, { params })
  return response.data
}

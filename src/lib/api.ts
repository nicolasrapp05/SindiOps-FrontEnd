import axios from "axios"
import api from "./axios"
import type { ApiResponse, ApiError, PaginatedResponse } from "@/types"

const GENERIC_AXIOS_MESSAGE = /^Request failed with status code \d+$/
const GENERIC_VALIDATION_TITLE = "One or more validation errors occurred."

/** Mensagens quando a API não retorna detalhe por campo. */
const FIELD_HINTS: Record<string, string> = {
  condominioids: "Selecione ao menos um condomínio",
  email: "Verifique o email informado",
  nome: "Verifique o nome informado",
  cargo: "Selecione um cargo válido",
  senha: "Verifique a senha informada",
  confirmarsenha: "As senhas informadas não coincidem",
}

function normalizeFieldKey(field: string): string {
  return field.replace(/\[\d+\]/g, "").replace(/^\$\.?/, "").split(".").pop()?.toLowerCase() ?? field.toLowerCase()
}

function hintForField(field: string): string | undefined {
  return FIELD_HINTS[normalizeFieldKey(field)]
}

function pushMessage(messages: string[], message: unknown) {
  if (typeof message !== "string") return
  const trimmed = message.trim()
  if (!trimmed || messages.includes(trimmed)) return
  messages.push(trimmed)
}

function collectFromErrorsObject(errors: Record<string, unknown>, messages: string[]) {
  for (const [field, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          pushMessage(messages, item)
        } else if (item && typeof item === "object" && "message" in item) {
          pushMessage(messages, (item as ApiError).message)
        }
      }
      if (value.length === 0) {
        const hint = hintForField(field)
        if (hint) pushMessage(messages, hint)
      }
      continue
    }

    if (typeof value === "string") {
      pushMessage(messages, value)
      continue
    }

    if (value && typeof value === "object" && "message" in value) {
      pushMessage(messages, (value as { message?: string }).message)
    }
  }
}

function collectValidationMessages(errors: unknown): string[] {
  const messages: string[] = []
  if (!errors) return messages

  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (typeof item === "string") {
        pushMessage(messages, item)
      } else if (item && typeof item === "object") {
        const apiError = item as ApiError
        if (apiError.message) {
          pushMessage(messages, apiError.message)
        } else if (apiError.field) {
          const hint = hintForField(apiError.field)
          if (hint) pushMessage(messages, hint)
        }
      }
    }
    return messages
  }

  if (typeof errors === "object") {
    collectFromErrorsObject(errors as Record<string, unknown>, messages)
  }

  return messages
}

function extractApiErrorBody(data: unknown): string | undefined {
  if (!data) return undefined

  if (typeof data === "string" && data.trim()) {
    return data.trim()
  }

  if (typeof data !== "object") return undefined

  const body = data as Record<string, unknown>
  const validationMessages = collectValidationMessages(body.errors)
  if (validationMessages.length > 0) {
    return validationMessages.join(" ")
  }

  if (typeof body.detail === "string" && body.detail.trim()) {
    return body.detail.trim()
  }

  if (typeof body.message === "string" && body.message.trim() && body.message !== "Erro de validação") {
    return body.message.trim()
  }

  if (typeof body.error === "string" && body.error.trim()) {
    return body.error.trim()
  }

  const title = typeof body.title === "string" ? body.title.trim() : undefined
  if (title && title !== GENERIC_VALIDATION_TITLE) {
    return title
  }

  return undefined
}

function statusFallback(status: number | undefined, fallback: string): string {
  switch (status) {
    case 400:
      return "Não foi possível processar a solicitação. Verifique os dados informados."
    case 401:
      return "Sessão expirada. Faça login novamente."
    case 403:
      return "Você não tem permissão para realizar esta ação."
    case 404:
      return "Registro não encontrado."
    case 422:
      return "Verifique os campos do formulário e tente novamente."
    case 429:
      return "Muitas tentativas. Aguarde um momento e tente novamente."
    case 500:
      return "Erro interno do servidor. Tente novamente em instantes."
    default:
      return fallback
  }
}

function unwrap<T>(envelope: ApiResponse<T>): T {
  if (envelope.success) {
    return envelope.data
  }

  const validationMessages = collectValidationMessages(envelope.errors)
  if (validationMessages.length > 0) {
    throw new Error(validationMessages.join(" "))
  }

  if (envelope.message?.trim()) {
    throw new Error(envelope.message.trim())
  }

  throw new Error("Não foi possível concluir a operação.")
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const fromBody = extractApiErrorBody(error.response?.data)
    if (fromBody) return fromBody

    if (!error.response) {
      return error.code === "ECONNABORTED"
        ? "A requisição demorou demais. Verifique sua conexão e tente novamente."
        : "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente."
    }

    return statusFallback(error.response.status, fallback)
  }

  if (error instanceof Error && error.message.trim()) {
    if (!GENERIC_AXIOS_MESSAGE.test(error.message)) {
      return error.message.trim()
    }
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

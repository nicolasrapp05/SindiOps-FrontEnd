import { get, post, put, del } from "@/lib/api"
import type { CreateTemplateRequest, EmailTemplate } from "../types/template.types"

export function getTemplates(tipo?: string) {
  return get<EmailTemplate[]>("/email-templates", tipo ? { tipo } : undefined)
}

export function getTemplate(id: string) {
  return get<EmailTemplate>(`/email-templates/${id}`)
}

export function createTemplate(data: CreateTemplateRequest) {
  return post<EmailTemplate>("/email-templates", data)
}

export function updateTemplate(id: string, data: CreateTemplateRequest) {
  return put<EmailTemplate>(`/email-templates/${id}`, data)
}

export function deleteTemplate(id: string) {
  return del<null>(`/email-templates/${id}`)
}

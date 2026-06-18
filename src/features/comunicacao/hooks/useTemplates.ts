import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import { removeListItem, setDetailCache, upsertListItem } from "@/lib/query-cache"
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../services/templates.service"
import type { CreateTemplateRequest, EmailTemplate } from "../types/template.types"

export function useTemplates(tipo?: string) {
  return useQuery({
    queryKey: ["email-templates", tipo],
    queryFn: () => getTemplates(tipo),
    placeholderData: keepPreviousData,
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ["email-templates", "detail", id],
    queryFn: () => getTemplate(id),
    enabled: !!id,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTemplateRequest) => createTemplate(data),
    onSuccess: (template) => {
      upsertListItem<EmailTemplate>(qc, ["email-templates"], template, { prependIfMissing: true })
      toast.success("Template criado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao criar template")),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTemplateRequest }) =>
      updateTemplate(id, data),
    onSuccess: (template) => {
      upsertListItem<EmailTemplate>(qc, ["email-templates"], template)
      setDetailCache(qc, ["email-templates", "detail", template.id], template)
      toast.success("Template atualizado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao atualizar template")),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: (_data, id) => {
      removeListItem<EmailTemplate>(qc, ["email-templates"], id)
      qc.removeQueries({ queryKey: ["email-templates", "detail", id] })
      toast.success("Template removido com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao remover template")),
  })
}

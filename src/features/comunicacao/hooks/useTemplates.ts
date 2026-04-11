import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../services/templates.service"
import type { CreateTemplateRequest } from "../types/template.types"

export function useTemplates(tipo?: string) {
  return useQuery({
    queryKey: ["email-templates", tipo],
    queryFn: () => getTemplates(tipo),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-templates"] })
      toast.success("Template criado com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar template"),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTemplateRequest }) =>
      updateTemplate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-templates"] })
      toast.success("Template atualizado com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar template"),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-templates"] })
      toast.success("Template removido com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao remover template"),
  })
}

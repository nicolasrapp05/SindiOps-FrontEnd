import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getFuncionarios,
  convidarFuncionario,
  updateFuncionario,
  ativarFuncionario,
  desativarFuncionario,
} from "../services/funcionarios.service"
import type { ConvidarFuncionarioRequest, FuncionarioFilters } from "../types/funcionario.types"

export function useFuncionarios(filters?: FuncionarioFilters) {
  return useQuery({
    queryKey: ["funcionarios", filters],
    queryFn: () => getFuncionarios(filters),
  })
}

export function useConvidarFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ConvidarFuncionarioRequest) => convidarFuncionario(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcionarios"] })
      toast.success("Convite enviado com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao enviar convite"),
  })
}

export function useUpdateFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ConvidarFuncionarioRequest> }) =>
      updateFuncionario(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcionarios"] })
      toast.success("Funcionário atualizado")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar funcionário"),
  })
}

export function useAtivarFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ativarFuncionario(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcionarios"] })
      toast.success("Funcionário ativado")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao ativar funcionário"),
  })
}

export function useDesativarFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => desativarFuncionario(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcionarios"] })
      toast.success("Funcionário desativado")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao desativar funcionário"),
  })
}

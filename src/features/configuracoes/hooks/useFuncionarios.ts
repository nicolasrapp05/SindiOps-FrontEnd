import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import { upsertListItem } from "@/lib/query-cache"
import {
  getFuncionarios,
  convidarFuncionario,
  updateFuncionario,
  ativarFuncionario,
  desativarFuncionario,
} from "../services/funcionarios.service"
import type { ConvidarFuncionarioRequest, Funcionario, FuncionarioFilters } from "../types/funcionario.types"

export function useFuncionarios(filters?: FuncionarioFilters) {
  return useQuery({
    queryKey: ["funcionarios", filters],
    queryFn: () => getFuncionarios(filters),
    placeholderData: keepPreviousData,
  })
}

export function useConvidarFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ConvidarFuncionarioRequest) => convidarFuncionario(data),
    onSuccess: (funcionario) => {
      upsertListItem<Funcionario>(qc, ["funcionarios"], funcionario, { prependIfMissing: true })
      toast.success("Convite enviado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao enviar convite")),
  })
}

export function useUpdateFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ConvidarFuncionarioRequest> }) =>
      updateFuncionario(id, data),
    onSuccess: (funcionario) => {
      upsertListItem<Funcionario>(qc, ["funcionarios"], funcionario)
      toast.success("Funcionário atualizado")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao atualizar funcionário")),
  })
}

export function useAtivarFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ativarFuncionario(id),
    onSuccess: (funcionario) => {
      if (funcionario) {
        upsertListItem<Funcionario>(qc, ["funcionarios"], funcionario)
      } else {
        qc.invalidateQueries({ queryKey: ["funcionarios"] })
      }
      toast.success("Funcionário ativado")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao ativar funcionário")),
  })
}

export function useDesativarFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => desativarFuncionario(id),
    onSuccess: (funcionario) => {
      if (funcionario) {
        upsertListItem<Funcionario>(qc, ["funcionarios"], funcionario)
      } else {
        qc.invalidateQueries({ queryKey: ["funcionarios"] })
      }
      toast.success("Funcionário desativado")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao desativar funcionário")),
  })
}

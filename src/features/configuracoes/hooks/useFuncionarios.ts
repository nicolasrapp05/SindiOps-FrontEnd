import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import { removeListItem, upsertListItem } from "@/lib/query-cache"
import {
  getFuncionarios,
  convidarFuncionario,
  updateFuncionario,
  ativarFuncionario,
  desativarFuncionario,
  reenviarConviteFuncionario,
  deleteFuncionario,
} from "../services/funcionarios.service"
import type { ConvidarFuncionarioRequest, Funcionario, FuncionarioFilters, UpdateFuncionarioRequest } from "../types/funcionario.types"

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
      if (funcionario.conviteEnviado === false) {
        toast.warning(
          "Funcionário cadastrado, mas o email de convite não foi enviado. Verifique a configuração de email.",
        )
        return
      }
      toast.success("Convite enviado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao enviar convite")),
  })
}

export function useUpdateFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFuncionarioRequest }) =>
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
      upsertListItem<Funcionario>(qc, ["funcionarios"], funcionario)
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
      upsertListItem<Funcionario>(qc, ["funcionarios"], funcionario)
      toast.success("Funcionário desativado")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao desativar funcionário")),
  })
}

export function useReenviarConviteFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reenviarConviteFuncionario(id),
    onSuccess: (funcionario) => {
      upsertListItem<Funcionario>(qc, ["funcionarios"], funcionario)
      toast.success("Convite reenviado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao reenviar convite")),
  })
}

export function useDeleteFuncionario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFuncionario(id),
    onSuccess: (_data, id) => {
      removeListItem<Funcionario>(qc, ["funcionarios"], id)
      toast.success("Funcionário removido com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao remover funcionário")),
  })
}

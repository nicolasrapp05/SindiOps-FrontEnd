import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import {
  removePaginatedItem,
  setDetailCache,
  upsertPaginatedItem,
} from "@/lib/query-cache"
import {
  getFornecedores,
  getFornecedor,
  createFornecedor,
  updateFornecedor,
  deleteFornecedor,
} from "../services/fornecedores.service"
import type { CreateFornecedorRequest, FornecedoresFilters, Fornecedor } from "../types/fornecedor.types"

export function useFornecedores(filters?: FornecedoresFilters) {
  return useQuery({
    queryKey: ["fornecedores", filters],
    queryFn: () => getFornecedores(filters),
    placeholderData: keepPreviousData,
  })
}

export function useFornecedor(id: string) {
  return useQuery({
    queryKey: ["fornecedores", "detail", id],
    queryFn: () => getFornecedor(id),
    enabled: !!id,
  })
}

export function useCreateFornecedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFornecedorRequest) => createFornecedor(data),
    onSuccess: (fornecedor) => {
      upsertPaginatedItem<Fornecedor>(qc, ["fornecedores"], fornecedor, { prependIfMissing: true })
      toast.success("Fornecedor cadastrado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao cadastrar fornecedor")),
  })
}

export function useUpdateFornecedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateFornecedorRequest }) =>
      updateFornecedor(id, data),
    onSuccess: (fornecedor) => {
      upsertPaginatedItem<Fornecedor>(qc, ["fornecedores"], fornecedor)
      setDetailCache(qc, ["fornecedores", "detail", fornecedor.id], fornecedor)
      toast.success("Fornecedor atualizado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao atualizar fornecedor")),
  })
}

export function useDeleteFornecedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFornecedor(id),
    onSuccess: (_data, id) => {
      removePaginatedItem<Fornecedor>(qc, ["fornecedores"], id)
      qc.removeQueries({ queryKey: ["fornecedores", "detail", id] })
      toast.success("Fornecedor removido com sucesso")
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(
          err,
          "Não é possível remover o fornecedor pois existem contratos vinculados",
        ),
      ),
  })
}

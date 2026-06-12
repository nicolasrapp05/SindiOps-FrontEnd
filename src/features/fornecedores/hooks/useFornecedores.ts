import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getFornecedores,
  getFornecedor,
  createFornecedor,
  updateFornecedor,
  deleteFornecedor,
} from "../services/fornecedores.service"
import type { CreateFornecedorRequest, FornecedoresFilters } from "../types/fornecedor.types"

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornecedores"] })
      toast.success("Fornecedor cadastrado com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar fornecedor"),
  })
}

export function useUpdateFornecedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateFornecedorRequest }) =>
      updateFornecedor(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornecedores"] })
      toast.success("Fornecedor atualizado com sucesso")
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar fornecedor"),
  })
}

export function useDeleteFornecedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFornecedor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornecedores"] })
      toast.success("Fornecedor removido com sucesso")
    },
    onError: (err) =>
      toast.error(
        err instanceof Error
          ? err.message
          : "Não é possível remover o fornecedor pois existem contratos vinculados",
      ),
  })
}

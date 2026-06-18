import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import {
  patchDetailCache,
  removeListItem,
  setDetailCache,
  upsertListItem,
} from "@/lib/query-cache"
import {
  getCondominios,
  getCondominio,
  createCondominio,
  updateCondominio,
  deleteCondominio,
  getBlocos,
  createBloco,
  deleteBloco,
  updateBloco,
  createUnidade,
  updateUnidade,
  deleteUnidade,
} from "../services/condominios.service"
import type { Bloco, Condominio, CreateCondominioRequest, Unidade } from "../types/condominio.types"

export function useCondominios() {
  return useQuery({
    queryKey: ["condominios"],
    queryFn: getCondominios,
    placeholderData: keepPreviousData,
  })
}

export function useCondominio(id: string) {
  return useQuery({
    queryKey: ["condominios", id],
    queryFn: () => getCondominio(id),
    enabled: !!id,
  })
}

function syncCondominioList(qc: ReturnType<typeof useQueryClient>, condominio: Condominio) {
  upsertListItem<Condominio>(qc, ["condominios"], condominio)
  setDetailCache(qc, ["condominios", condominio.id], condominio)
}

function patchBlocosCache(
  qc: ReturnType<typeof useQueryClient>,
  condominioId: string,
  updater: (blocos: Bloco[]) => Bloco[],
) {
  qc.setQueryData<Bloco[]>(["condominios", condominioId, "blocos"], (old) =>
    old ? updater(old) : old,
  )
}

function patchCondominioTotals(
  qc: ReturnType<typeof useQueryClient>,
  condominioId: string,
  patch: Partial<Pick<Condominio, "totalBlocos" | "totalUnidades">>,
) {
  qc.setQueriesData<Condominio[]>({ queryKey: ["condominios"] }, (old) => {
    if (!old) return old
    return old.map((c) => (c.id === condominioId ? { ...c, ...patch } : c))
  })
  patchDetailCache<Condominio>(qc, ["condominios", condominioId], (old) =>
    old ? { ...old, ...patch } : old,
  )
}

export function useCreateCondominio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCondominioRequest) => createCondominio(data),
    onSuccess: (condominio) => {
      upsertListItem<Condominio>(qc, ["condominios"], condominio, { prependIfMissing: true })
    },
  })
}

export function useUpdateCondominio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCondominioRequest }) =>
      updateCondominio(id, data),
    onSuccess: (condominio) => {
      syncCondominioList(qc, condominio)
    },
  })
}

export function useDeleteCondominio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCondominio(id),
    onSuccess: (_data, id) => {
      removeListItem<Condominio>(qc, ["condominios"], id)
      qc.removeQueries({ queryKey: ["condominios", id] })
      qc.removeQueries({ queryKey: ["condominios", id, "blocos"] })
    },
  })
}

export function useBlocos(condominioId: string) {
  return useQuery({
    queryKey: ["condominios", condominioId, "blocos"],
    queryFn: () => getBlocos(condominioId),
    enabled: !!condominioId,
    placeholderData: keepPreviousData,
  })
}

export function useCreateBloco(condominioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (nome: string) => createBloco(condominioId, nome),
    onSuccess: (bloco) => {
      patchBlocosCache(qc, condominioId, (blocos) => [...blocos, bloco])
      patchCondominioTotals(qc, condominioId, {
        totalBlocos: (qc.getQueryData<Condominio>(["condominios", condominioId])?.totalBlocos ?? 0) + 1,
      })
    },
  })
}

export function useUpdateBloco(condominioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ blocoId, nome }: { blocoId: string; nome: string }) =>
      updateBloco(condominioId, blocoId, nome),
    onSuccess: (bloco) => {
      patchBlocosCache(qc, condominioId, (blocos) =>
        blocos.map((b) => (b.id === bloco.id ? bloco : b)),
      )
    },
  })
}

export function useDeleteBloco(condominioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (blocoId: string) => deleteBloco(condominioId, blocoId),
    onSuccess: (_data, blocoId) => {
      const blocos = qc.getQueryData<Bloco[]>(["condominios", condominioId, "blocos"])
      const removed = blocos?.find((b) => b.id === blocoId)
      patchBlocosCache(qc, condominioId, (items) => items.filter((b) => b.id !== blocoId))
      if (removed) {
        patchCondominioTotals(qc, condominioId, {
          totalBlocos: Math.max(
            0,
            (qc.getQueryData<Condominio>(["condominios", condominioId])?.totalBlocos ?? 1) - 1,
          ),
          totalUnidades: Math.max(
            0,
            (qc.getQueryData<Condominio>(["condominios", condominioId])?.totalUnidades ?? 0) -
              removed.unidades.length,
          ),
        })
      }
    },
  })
}

export function useCreateUnidade(condominioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ blocoId, numero }: { blocoId: string; numero: string }) =>
      createUnidade(condominioId, blocoId, numero),
    onSuccess: (unidade, { blocoId }) => {
      patchBlocosCache(qc, condominioId, (blocos) =>
        blocos.map((b) =>
          b.id === blocoId ? { ...b, unidades: [...b.unidades, unidade as Unidade] } : b,
        ),
      )
      patchCondominioTotals(qc, condominioId, {
        totalUnidades:
          (qc.getQueryData<Condominio>(["condominios", condominioId])?.totalUnidades ?? 0) + 1,
      })
    },
  })
}

export function useUpdateUnidade(condominioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      blocoId,
      unidadeId,
      numero,
    }: {
      blocoId: string
      unidadeId: string
      numero: string
    }) => updateUnidade(condominioId, blocoId, unidadeId, numero),
    onSuccess: (unidade, { blocoId }) => {
      patchBlocosCache(qc, condominioId, (blocos) =>
        blocos.map((b) =>
          b.id === blocoId
            ? {
                ...b,
                unidades: b.unidades.map((u) => (u.id === unidade.id ? unidade : u)),
              }
            : b,
        ),
      )
    },
  })
}

export function useDeleteUnidade(condominioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ blocoId, unidadeId }: { blocoId: string; unidadeId: string }) =>
      deleteUnidade(condominioId, blocoId, unidadeId),
    onSuccess: (_data, { blocoId, unidadeId }) => {
      patchBlocosCache(qc, condominioId, (blocos) =>
        blocos.map((b) =>
          b.id === blocoId
            ? { ...b, unidades: b.unidades.filter((u) => u.id !== unidadeId) }
            : b,
        ),
      )
      patchCondominioTotals(qc, condominioId, {
        totalUnidades: Math.max(
          0,
          (qc.getQueryData<Condominio>(["condominios", condominioId])?.totalUnidades ?? 1) - 1,
        ),
      })
    },
  })
}

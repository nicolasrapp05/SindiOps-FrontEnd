import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type QueryClient,
} from "@tanstack/react-query"
import {
  patchDetailCache,
  patchListItem,
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

const LIST_KEY = ["condominios"] as const

function blocosKey(condominioId: string) {
  return ["condominios", condominioId, "blocos"] as const
}

function detailKey(condominioId: string) {
  return ["condominios", condominioId] as const
}

function getCondominioFromList(qc: QueryClient, condominioId: string) {
  return qc.getQueryData<Condominio[]>(LIST_KEY)?.find((c) => c.id === condominioId)
}

/** Refetch blocos e lista após operações em massa (ex.: Configuração Rápida). */
export function invalidateCondominioEstrutura(qc: QueryClient, condominioId: string) {
  void qc.invalidateQueries({ queryKey: blocosKey(condominioId) })
  void qc.invalidateQueries({ queryKey: LIST_KEY, exact: true })
}

function syncCondominioList(qc: QueryClient, condominio: Condominio) {
  upsertListItem<Condominio>(qc, LIST_KEY, condominio)
  setDetailCache(qc, detailKey(condominio.id), condominio)
}

function patchBlocosCache(
  qc: QueryClient,
  condominioId: string,
  updater: (blocos: Bloco[]) => Bloco[],
) {
  const key = blocosKey(condominioId)
  const old = qc.getQueryData<Bloco[]>(key)
  if (old) {
    qc.setQueryData<Bloco[]>(key, updater(old))
  } else {
    void qc.invalidateQueries({ queryKey: key })
  }
}

function patchCondominioTotals(
  qc: QueryClient,
  condominioId: string,
  patch: Partial<Pick<Condominio, "totalBlocos" | "totalUnidades">>,
) {
  patchListItem<Condominio>(qc, LIST_KEY, condominioId, patch)
  patchDetailCache<Condominio>(qc, detailKey(condominioId), (old) =>
    old ? { ...old, ...patch } : old,
  )
}

export function useCondominios() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: getCondominios,
    placeholderData: keepPreviousData,
  })
}

export function useCondominio(id: string) {
  return useQuery({
    queryKey: detailKey(id),
    queryFn: () => getCondominio(id),
    enabled: !!id,
  })
}

export function useCreateCondominio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCondominioRequest) => createCondominio(data),
    onSuccess: (condominio) => {
      upsertListItem<Condominio>(qc, LIST_KEY, condominio, { prependIfMissing: true })
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
      removeListItem<Condominio>(qc, LIST_KEY, id)
      qc.removeQueries({ queryKey: detailKey(id) })
      qc.removeQueries({ queryKey: blocosKey(id) })
    },
  })
}

export function useBlocos(condominioId: string) {
  return useQuery({
    queryKey: blocosKey(condominioId),
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
        totalBlocos: (getCondominioFromList(qc, condominioId)?.totalBlocos ?? 0) + 1,
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
      const blocos = qc.getQueryData<Bloco[]>(blocosKey(condominioId))
      const removed = blocos?.find((b) => b.id === blocoId)
      patchBlocosCache(qc, condominioId, (items) => items.filter((b) => b.id !== blocoId))
      if (removed) {
        const current = getCondominioFromList(qc, condominioId)
        patchCondominioTotals(qc, condominioId, {
          totalBlocos: Math.max(0, (current?.totalBlocos ?? 1) - 1),
          totalUnidades: Math.max(0, (current?.totalUnidades ?? 0) - removed.unidades.length),
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
        totalUnidades: (getCondominioFromList(qc, condominioId)?.totalUnidades ?? 0) + 1,
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
          (getCondominioFromList(qc, condominioId)?.totalUnidades ?? 1) - 1,
        ),
      })
    },
  })
}

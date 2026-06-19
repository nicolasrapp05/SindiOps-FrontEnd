import type { QueryClient, QueryKey } from "@tanstack/react-query"
import type { PaginatedResponse } from "@/types"

export type HasStringId = { id: string }

/** Atualiza ou insere um item em todas as queries paginadas com o prefixo informado. */
export function upsertPaginatedItem<T extends HasStringId>(
  qc: QueryClient,
  queryKeyPrefix: QueryKey,
  item: T,
  options?: { prependIfMissing?: boolean },
) {
  qc.setQueriesData<PaginatedResponse<T>>(
    { queryKey: queryKeyPrefix },
    (old) => {
      if (!old?.data) return old
      const idx = old.data.findIndex((x) => x.id === item.id)
      if (idx >= 0) {
        const data = [...old.data]
        data[idx] = item
        return { ...old, data }
      }
      if (!options?.prependIfMissing) return old
      return {
        ...old,
        data: [item, ...old.data].slice(0, old.pageSize),
        totalCount: old.totalCount + 1,
      }
    },
  )
}

/** Aplica um patch em um item das queries paginadas. */
export function patchPaginatedItem<T extends HasStringId>(
  qc: QueryClient,
  queryKeyPrefix: QueryKey,
  id: string,
  updater: (item: T) => T,
) {
  qc.setQueriesData<PaginatedResponse<T>>(
    { queryKey: queryKeyPrefix },
    (old) => {
      if (!old?.data) return old
      const idx = old.data.findIndex((x) => x.id === id)
      if (idx < 0) return old
      const data = [...old.data]
      data[idx] = updater(data[idx])
      return { ...old, data }
    },
  )
}

/** Remove um item das queries paginadas. */
export function removePaginatedItem<T extends HasStringId>(
  qc: QueryClient,
  queryKeyPrefix: QueryKey,
  id: string,
) {
  qc.setQueriesData<PaginatedResponse<T>>(
    { queryKey: queryKeyPrefix },
    (old) => {
      if (!old?.data) return old
      if (!old.data.some((x) => x.id === id)) return old
      return {
        ...old,
        data: old.data.filter((x) => x.id !== id),
        totalCount: Math.max(0, old.totalCount - 1),
      }
    },
  )
}

/** Atualiza ou insere um item em listas simples (não paginadas) — query key exata. */
export function upsertListItem<T extends HasStringId>(
  qc: QueryClient,
  queryKey: QueryKey,
  item: T,
  options?: { prependIfMissing?: boolean },
) {
  qc.setQueryData<T[]>(queryKey, (old) => {
    if (!Array.isArray(old)) {
      return options?.prependIfMissing ? [item] : old
    }
    const idx = old.findIndex((x) => x.id === item.id)
    if (idx >= 0) {
      const next = [...old]
      next[idx] = item
      return next
    }
    if (!options?.prependIfMissing) return old
    return [item, ...old]
  })
}

/** Aplica patch parcial em um item de lista simples — query key exata. */
export function patchListItem<T extends HasStringId>(
  qc: QueryClient,
  queryKey: QueryKey,
  id: string,
  patch: Partial<T>,
) {
  qc.setQueryData<T[]>(queryKey, (old) => {
    if (!Array.isArray(old)) return old
    const idx = old.findIndex((x) => x.id === id)
    if (idx < 0) return old
    const next = [...old]
    next[idx] = { ...next[idx], ...patch }
    return next
  })
}

/** Remove um item de listas simples — query key exata. */
export function removeListItem<T extends HasStringId>(
  qc: QueryClient,
  queryKey: QueryKey,
  id: string,
) {
  qc.setQueryData<T[]>(queryKey, (old) =>
    Array.isArray(old) ? old.filter((x) => x.id !== id) : old,
  )
}

/** Atualiza o cache de detalhe de uma entidade. */
export function setDetailCache<T>(qc: QueryClient, detailKey: QueryKey, data: T) {
  qc.setQueryData(detailKey, data)
}

/** Aplica patch no cache de detalhe. */
export function patchDetailCache<T>(
  qc: QueryClient,
  detailKey: QueryKey,
  updater: (current: T | undefined) => T | undefined,
) {
  qc.setQueryData<T>(detailKey, (old) => updater(old))
}

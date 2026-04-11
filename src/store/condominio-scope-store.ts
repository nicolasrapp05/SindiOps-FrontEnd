import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CondominioScopePick {
  id: string
  nome: string
}

interface CondominioScopeState {
  selectedCondominioId: string | null
  selectedCondominioNome: string | null
  setSelectedCondominio: (id: string, nome?: string | null) => void
  clearSelectedCondominio: () => void
  /** After list fetch: drop invalid id, auto-pick if exactly one, sync nome. */
  reconcileWithCondominiosList: (
    list: CondominioScopePick[] | undefined,
    fetchStatus: "pending" | "success" | "error",
  ) => void
}

export const useCondominioScopeStore = create<CondominioScopeState>()(
  persist(
    (set, get) => ({
      selectedCondominioId: null,
      selectedCondominioNome: null,

      setSelectedCondominio: (id, nome) =>
        set({
          selectedCondominioId: id,
          selectedCondominioNome: nome ?? null,
        }),

      clearSelectedCondominio: () =>
        set({ selectedCondominioId: null, selectedCondominioNome: null }),

      reconcileWithCondominiosList: (list, fetchStatus) => {
        if (fetchStatus !== "success") return
        const condos = list ?? []

        if (condos.length === 0) {
          const { selectedCondominioId } = get()
          if (selectedCondominioId !== null) {
            set({ selectedCondominioId: null, selectedCondominioNome: null })
          }
          return
        }

        const idSet = new Set(condos.map((c) => c.id))
        let nextId = get().selectedCondominioId
        let nextNome = get().selectedCondominioNome

        if (nextId !== null && !idSet.has(nextId)) {
          nextId = null
          nextNome = null
        }

        if (nextId === null && condos.length === 1) {
          nextId = condos[0].id
          nextNome = condos[0].nome
        }

        if (nextId !== null) {
          const row = condos.find((c) => c.id === nextId)
          if (row) nextNome = row.nome
        }

        set({
          selectedCondominioId: nextId,
          selectedCondominioNome: nextNome,
        })
      },
    }),
    {
      name: "sindicore_selected_condominio",
      partialize: (s) => ({
        selectedCondominioId: s.selectedCondominioId,
        selectedCondominioNome: s.selectedCondominioNome,
      }),
    },
  ),
)

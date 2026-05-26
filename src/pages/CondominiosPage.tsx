import { useEffect, useState } from "react"
import { Plus, Building2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCondominios,
  useCreateCondominio,
  useUpdateCondominio,
  useDeleteCondominio,
} from "@/features/condominios/hooks/useCondominios"
import type {
  Condominio,
  CreateCondominioRequest,
} from "@/features/condominios/types/condominio.types"
import CondominioCard from "@/features/condominios/components/CondominioCard"
import CondominioForm from "@/features/condominios/components/CondominioForm"
import EstruturaCondominio from "@/features/condominios/components/EstruturaCondominio"

export default function CondominiosPage() {
  const { data: condominios, isLoading, isError, refetch } = useCondominios()
  const createMutation = useCreateCondominio()
  const updateMutation = useUpdateCondominio()
  const deleteMutation = useDeleteCondominio()
  const scopeCondominioId = useCondominioScopeStore((s) => s.selectedCondominioId)

  const [formOpen, setFormOpen] = useState(false)
  const [editingCondominio, setEditingCondominio] = useState<Condominio | null>(null)
  const [selectedCondominio, setSelectedCondominio] = useState<Condominio | null>(null)

  useEffect(() => {
    if (!condominios?.length || !scopeCondominioId) return
    const match = condominios.find((c) => c.id === scopeCondominioId)
    if (!match) return
    setSelectedCondominio((prev) => (prev?.id === match.id ? prev : match))
  }, [condominios, scopeCondominioId])

  const scrollToEstrutura = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .getElementById("estrutura-condominio")
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    })
  }

  const openCreate = () => {
    setEditingCondominio(null)
    setFormOpen(true)
  }

  const openEdit = (c: Condominio) => {
    setEditingCondominio(c)
    setFormOpen(true)
  }

  const handleDelete = (c: Condominio) => {
    if (!confirm(`Tem certeza que deseja remover "${c.nome}"?`)) return
    deleteMutation.mutate(c.id, {
      onSuccess: () => {
        toast.success("Condomínio removido com sucesso")
        if (selectedCondominio?.id === c.id) setSelectedCondominio(null)
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Erro ao remover"),
    })
  }

  const handleFormSubmit = (data: CreateCondominioRequest) => {
    if (editingCondominio) {
      updateMutation.mutate(
        { id: editingCondominio.id, data },
        {
          onSuccess: () => {
            toast.success("Condomínio atualizado com sucesso")
            setFormOpen(false)
          },
          onError: (err) =>
            toast.error(err instanceof Error ? err.message : "Erro ao atualizar"),
        },
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success("Condomínio cadastrado com sucesso")
          setFormOpen(false)
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Erro ao cadastrar"),
      })
    }
  }

  // ── Loading ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Building2 className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Erro ao carregar condomínios
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Não foi possível buscar os dados. Tente novamente.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  const isEmpty = !condominios || condominios.length === 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Condomínios
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie seus condomínios e suas estruturas.
          </p>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            {scopeCondominioId
              ? "A secção Estrutura abaixo corresponde ao condomínio ativo na barra lateral; pode alterar selecionando outro card."
              : "Selecione um condomínio no card abaixo para cadastrar blocos e unidades na secção Estrutura."}
          </p>
        </div>
        <Button
          className="bg-emerald-700 hover:bg-emerald-800"
          onClick={openCreate}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Condomínio
        </Button>
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            Nenhum condomínio cadastrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Comece cadastrando seu primeiro condomínio.
          </p>
          <Button
            className="mt-6 bg-emerald-700 hover:bg-emerald-800"
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Cadastrar Condomínio
          </Button>
        </div>
      ) : (
        <>
          {/* Grid of cards */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {condominios.map((c) => (
              <CondominioCard
                key={c.id}
                condominio={c}
                isSelected={selectedCondominio?.id === c.id}
                onEdit={openEdit}
                onDelete={handleDelete}
                onSelect={(sel) =>
                  setSelectedCondominio(
                    selectedCondominio?.id === sel.id ? null : sel,
                  )
                }
                onOpenBlocosUnidades={(sel) => {
                  setSelectedCondominio(sel)
                  scrollToEstrutura()
                }}
              />
            ))}

            {/* Add card */}
            <button
              className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-white transition hover:border-emerald-400 hover:bg-emerald-50/30"
              onClick={openCreate}
            >
              <div className="rounded-full bg-gray-100 p-3">
                <Plus className="h-6 w-6 text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-500">
                Vincular novo condomínio
              </span>
            </button>
          </div>

          {/* Estrutura section */}
          {selectedCondominio && (
            <EstruturaCondominio
              condominioId={selectedCondominio.id}
              condominioNome={selectedCondominio.nome}
            />
          )}
        </>
      )}

      {/* Form dialog */}
      <CondominioForm
        open={formOpen}
        onOpenChange={setFormOpen}
        condominio={editingCondominio}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}

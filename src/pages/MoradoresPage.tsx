import { Fragment, useState } from "react"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import { Link } from "react-router-dom"
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Combobox from "@/components/shared/Combobox"
import { useQuery } from "@tanstack/react-query"
import { getBlocos } from "@/features/condominios/services/condominios.service"
import type { Bloco } from "@/features/condominios/types/condominio.types"
import {
  useMoradores,
  useCreateMorador,
  useUpdateMorador,
  useDeleteMorador,
} from "@/features/moradores/hooks/useMoradores"
import type {
  Morador,
  CreateMoradorRequest,
} from "@/features/moradores/types/morador.types"
import MoradorForm from "@/features/moradores/components/MoradorForm"
import MoradorExpandido from "@/features/moradores/components/MoradorExpandido"
import ConfirmDialog from "@/components/shared/ConfirmDialog"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { useDebounce } from "@/hooks/useDebounce"

export default function MoradoresPage() {
  const [search, setSearch] = useState("")
  const [blocoFilter, setBlocoFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingMorador, setEditingMorador] = useState<Morador | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Morador | null>(null)

  const condominioId = useCondominioScopeStore((s) => s.selectedCondominioId) ?? ""
  const condoConfigured = !!condominioId

  const debouncedSearch = useDebounce(search)

  const filters = {
    search: debouncedSearch || undefined,
    blocoId: blocoFilter !== "all" ? blocoFilter : undefined,
    page,
    pageSize: 20,
  }

  const { data: moradores, isLoading, isError, refetch } = useMoradores(condominioId, filters)
  const { data: blocos } = useQuery({
    queryKey: ["condominios", condominioId, "blocos"],
    queryFn: () => getBlocos(condominioId),
    enabled: !!condominioId,
  })

  const createMutation = useCreateMorador()
  const updateMutation = useUpdateMorador()
  const deleteMutation = useDeleteMorador()

  const openCreate = () => {
    setEditingMorador(null)
    setFormOpen(true)
  }

  const openEdit = (m: Morador) => {
    setEditingMorador(m)
    setFormOpen(true)
  }

  const handleDelete = (m: Morador) => {
    setPendingDelete(m)
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success("Morador removido com sucesso")
        setPendingDelete(null)
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, "Erro ao remover"))
        setPendingDelete(null)
      },
    })
  }

  const handleFormSubmit = (data: CreateMoradorRequest) => {
    if (editingMorador) {
      updateMutation.mutate(
        { id: editingMorador.id, data },
        { onSuccess: () => setFormOpen(false) },
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setFormOpen(false),
      })
    }
  }

  const moradorList = moradores?.data ?? []
  const totalCount = moradores?.totalCount
  const totalPages = totalCount ? Math.ceil(totalCount / 20) : 1

  // ── Loading ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Users className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Erro ao carregar moradores</h3>
        <p className="mt-1 text-sm text-gray-500">Verifique sua conexão e tente novamente.</p>
        <Button variant="outline" className="mt-6" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Moradores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os moradores, unidades e histórico de comunicações.
          </p>
        </div>
        <Button
          className="bg-emerald-700 hover:bg-emerald-800"
          disabled={!condoConfigured}
          onClick={openCreate}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Morador
        </Button>
      </div>

      {!condoConfigured && (
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
          Selecione um condomínio na barra lateral para carregar moradores e cadastrar novos
          registros. Se ainda não houver condomínios, cadastre em{" "}
          <Link
            to="/condominios"
            className="font-medium text-emerald-800 underline underline-offset-2"
          >
            Condomínios
          </Link>
          .
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Combobox
          options={[
            { value: "all", label: "Todos os Blocos" },
            ...(blocos?.map((b: Bloco) => ({ value: b.id, label: b.nome })) ?? []),
          ]}
          value={blocoFilter}
          onValueChange={(v) => { setBlocoFilter(v); setPage(1) }}
          placeholder="Buscar…"
          className="w-44"
        />
      </div>

      {/* Table */}
      {moradorList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Nenhum morador encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Cadastre o primeiro morador do condomínio.</p>
          <Button
            className="mt-6 bg-emerald-700 hover:bg-emerald-800"
            disabled={!condoConfigured}
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Cadastrar Morador
          </Button>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>Bloco</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moradorList.map((m) => (
                  <Fragment key={m.id}>
                    <TableRow
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                    >
                      <TableCell className="font-medium text-gray-900">{m.nome}</TableCell>
                      <TableCell className="text-gray-600">{m.bloco.nome}</TableCell>
                      <TableCell className="text-gray-600">{m.unidade.numero}</TableCell>
                      <TableCell className="text-gray-500">{m.email}</TableCell>
                      <TableCell className="text-gray-500">{m.telefone || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedId(expandedId === m.id ? null : m.id)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(m)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(m)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === m.id && (
                      <TableRow key={`${m.id}-expand`}>
                        <TableCell colSpan={6} className="p-0">
                          <MoradorExpandido moradorId={m.id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalCount != null && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-gray-500">
                {totalCount} morador{totalCount !== 1 ? "es" : ""}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form dialog */}
      <MoradorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        condominioId={condominioId}
        morador={editingMorador}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Remover morador"
        description={`Tem certeza que deseja remover "${pendingDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}

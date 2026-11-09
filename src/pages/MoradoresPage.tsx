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
  EyeOff,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Combobox from "@/components/shared/Combobox"
import EmptyState from "@/components/shared/EmptyState"
import ListPagination from "@/components/shared/ListPagination"
import ListPanel from "@/components/shared/ListPanel"
import ListRecord from "@/components/shared/ListRecord"
import ListRecordButton from "@/components/shared/ListRecordButton"
import { ListSkeletonCards, ListSkeletonRows } from "@/components/shared/ListSkeleton"
import ListSortMenu from "@/components/shared/ListSortMenu"
import SortableHead from "@/components/shared/SortableHead"
import { nextSort, type SortColumn, type SortDir } from "@/lib/list-sort"
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
  MoradorPapel,
  CreateMoradorRequest,
} from "@/features/moradores/types/morador.types"
import { MORADOR_PAPEL_LABEL } from "@/features/moradores/types/morador.types"
import { cn } from "@/lib/utils"
import MoradorForm from "@/features/moradores/components/MoradorForm"
import MoradorExpandido from "@/features/moradores/components/MoradorExpandido"
import ConfirmDialog from "@/components/shared/ConfirmDialog"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { useDebounce } from "@/hooks/useDebounce"

const SORT_COLUMNS: SortColumn[] = [
  { key: "nome", label: "Nome" },
  { key: "papel", label: "Papel" },
  { key: "bloco", label: "Bloco" },
  { key: "unidade", label: "Unidade" },
]

const PAPEL_CLASS: Record<MoradorPapel, string> = {
  proprietario: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  inquilino: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  ocupante: "bg-gray-100 text-gray-600 hover:bg-gray-100",
}

export default function MoradoresPage() {
  const [search, setSearch] = useState("")
  const [blocoFilter, setBlocoFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string>()
  const [dir, setDir] = useState<SortDir>()
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
    sort,
    dir,
  }

  const sortBy = (column: string) => {
    const next = nextSort(sort, dir, column)
    setSort(next.sort)
    setDir(next.dir)
    setPage(1)
  }

  const { data: moradores, isLoading, isPlaceholderData, isError, refetch } = useMoradores(condominioId, filters)
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
  const listaCarregando = condoConfigured && (isLoading || isPlaceholderData)

  // ── Error ───────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Users className="text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Erro ao carregar moradores</h3>
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Moradores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os moradores, unidades e histórico de comunicações.
          </p>
        </div>
        <Button
          
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
      <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-center">
        <ListSortMenu
          columns={SORT_COLUMNS}
          sort={sort}
          dir={dir}
          onChange={(nextSortKey, nextDir) => {
            setSort(nextSortKey)
            setDir(nextDir)
            setPage(1)
          }}
          className="w-full min-w-0 md:hidden"
        />
        <div className="relative w-full min-w-0 md:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            autoComplete="off"
            spellCheck={false}
            aria-label="Buscar moradores"
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
          className="w-full min-w-0 md:w-44"
        />
      </div>

      {/* Table */}
      {!listaCarregando && moradorList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum morador encontrado"
          description="Cadastre o primeiro morador do condomínio."
          action={
            <Button disabled={!condoConfigured} onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Cadastrar Morador
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {listaCarregando ? (
            <ListSkeletonCards />
          ) : (
          <div className="space-y-3 md:hidden">
            {moradorList.map((m) => (
              <ListRecord
                key={m.id}
                title={m.nome}
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                fields={[
                  {
                    label: "Papel",
                    value: (
                      <Badge variant="secondary" className={cn("font-medium", PAPEL_CLASS[m.papel])}>
                        {MORADOR_PAPEL_LABEL[m.papel]}
                      </Badge>
                    ),
                  },
                  { label: "Bloco", value: m.bloco.nome },
                  { label: "Unidade", value: m.unidade.numero },
                  { label: "Email", value: m.email },
                  { label: "Telefone", value: m.telefone || "-" },
                ]}
                actions={
                  <>
                    <ListRecordButton icon={Pencil} onClick={() => openEdit(m)}>
                      Editar
                    </ListRecordButton>
                    <ListRecordButton icon={Trash2} tone="danger" onClick={() => handleDelete(m)}>
                      Excluir
                    </ListRecordButton>
                  </>
                }
                primaryAction={
                  <ListRecordButton
                    icon={expandedId === m.id ? EyeOff : Eye}
                    onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  >
                    {expandedId === m.id ? "Ocultar" : "Detalhes"}
                  </ListRecordButton>
                }
              >
                {expandedId === m.id ? <MoradorExpandido moradorId={m.id} /> : null}
              </ListRecord>
            ))}
          </div>
          )}
          <ListPanel className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableHead label="Nome" column="nome" sort={sort} dir={dir} onSort={sortBy} className="w-[22%]" />
                  <SortableHead label="Papel" column="papel" sort={sort} dir={dir} onSort={sortBy} className="w-[12%]" />
                  <SortableHead label="Bloco" column="bloco" sort={sort} dir={dir} onSort={sortBy} className="w-[10%]" />
                  <SortableHead label="Unidade" column="unidade" sort={sort} dir={dir} onSort={sortBy} className="w-[10%]" />
                  <TableHead className="w-[20%]">Email</TableHead>
                  <TableHead className="w-[14%]">Telefone</TableHead>
                  <TableHead className="w-[12%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCarregando ? (
                  <ListSkeletonRows columns={7} />
                ) : moradorList.map((m) => (
                  <Fragment key={m.id}>
                    <TableRow
                      className="cursor-pointer transition-colors hover:bg-muted/60"
                      onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                    >
                      <TableCell className="truncate font-medium text-foreground">{m.nome}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("font-medium", PAPEL_CLASS[m.papel])}>
                          {MORADOR_PAPEL_LABEL[m.papel]}
                        </Badge>
                      </TableCell>
                      <TableCell className="truncate text-gray-600">{m.bloco.nome}</TableCell>
                      <TableCell className="truncate text-gray-600">{m.unidade.numero}</TableCell>
                      <TableCell className="truncate text-gray-500">{m.email}</TableCell>
                      <TableCell className="truncate text-gray-500">{m.telefone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedId(expandedId === m.id ? null : m.id)
                            }}
                           aria-label="Ver detalhes">
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(m)
                            }}
                           aria-label="Editar">
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(m)
                            }}
                           aria-label="Excluir">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === m.id && (
                      <TableRow key={`${m.id}-expand`}>
                        <TableCell colSpan={7} className="p-0">
                          <MoradorExpandido moradorId={m.id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </ListPanel>
          {!listaCarregando && totalCount != null && (
            <ListPagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              singular="morador"
              pluralLabel="moradores"
              onPage={setPage}
            />
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

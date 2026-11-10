import { Fragment, useMemo, useState } from "react"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import {
  Plus,
  Search,
  Truck,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Package,
  Wrench,
  FileText,
  TrendingUp,
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
import {
  useFornecedores,
  useCreateFornecedor,
  useUpdateFornecedor,
  useDeleteFornecedor,
} from "@/features/fornecedores/hooks/useFornecedores"
import { useContratosGlobais } from "@/features/contratos/hooks/useContratos"
import type {
  Fornecedor,
  CreateFornecedorRequest,
} from "@/features/fornecedores/types/fornecedor.types"
import FornecedorForm from "@/features/fornecedores/components/FornecedorForm"
import FornecedorExpandido from "@/features/fornecedores/components/FornecedorExpandido"
import ConfirmDialog from "@/components/shared/ConfirmDialog"
import EmptyState from "@/components/shared/EmptyState"
import ListPagination from "@/components/shared/ListPagination"
import { DEFAULT_PAGE_SIZE, type PageSizeOption } from "@/lib/pagination"
import ListBusy from "@/components/shared/ListBusy"
import ListPanel from "@/components/shared/ListPanel"
import ListRecord from "@/components/shared/ListRecord"
import ListRecordButton from "@/components/shared/ListRecordButton"
import { KpiCardSkeleton } from "@/components/shared/KpiCardSkeleton"
import { ListSkeletonCards, ListSkeletonRows } from "@/components/shared/ListSkeleton"
import ListSortMenu from "@/components/shared/ListSortMenu"
import { listColumn, listColumns, listFlex } from "@/components/shared/list-columns"
import RowActions from "@/components/shared/RowActions"
import SortableHead from "@/components/shared/SortableHead"
import { nextSort, type SortColumn, type SortDir } from "@/lib/list-sort"
import { useDebounce } from "@/hooks/useDebounce"

const SORT_COLUMNS: SortColumn[] = [
  { key: "nome", label: "Nome" },
  { key: "cnpj", label: "CNPJ" },
]

const SUMMARY_CARDS = [
  { key: "total",        label: "Total",           icon: Package,    color: "text-blue-600 bg-blue-50"      },
  { key: "comServicos",  label: "Com serviços",     icon: Wrench,     color: "text-emerald-600 bg-emerald-50"},
  { key: "comContrato",  label: "Com contrato",     icon: FileText,   color: "text-sky-600 bg-sky-50"        },
  { key: "esteMes",      label: "Cadastrados/mês",  icon: TrendingUp, color: "text-purple-600 bg-purple-50"  },
] as const

export default function FornecedoresPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE)
  const [sort, setSort] = useState<string>()
  const [dir, setDir] = useState<SortDir>()
  const [formOpen, setFormOpen] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Fornecedor | null>(null)

  const debouncedSearch = useDebounce(search)

  const filters = { search: debouncedSearch || undefined, page, pageSize, sort, dir }

  const sortBy = (column: string) => {
    const next = nextSort(sort, dir, column)
    setSort(next.sort)
    setDir(next.dir)
    setPage(1)
  }
  const { data: fornecedores, isLoading, isPlaceholderData, isError, refetch } = useFornecedores(filters)
  const { data: summaryData, isLoading: resumoListaCarregando } = useFornecedores({ page: 1, pageSize: 2000 })
  const { data: contratosGlobais, isLoading: contratosResumoCarregando } = useContratosGlobais({ pageSize: 2000 })
  const createMutation = useCreateFornecedor()
  const updateMutation = useUpdateFornecedor()
  const deleteMutation = useDeleteFornecedor()

  const fornecedorList = fornecedores?.data ?? []
  const totalCount = fornecedores?.totalCount
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1

  const summaryValues = useMemo(() => {
    const all = summaryData?.data ?? []
    const now = new Date()
    const fornecedoresComContrato = new Set(
      (contratosGlobais?.data ?? []).map((c) => c.fornecedor.id),
    )
    return {
      total:       summaryData?.totalCount ?? 0,
      comServicos: all.filter((f) => (f.servicos?.length ?? 0) > 0).length,
      comContrato: all.filter((f) => fornecedoresComContrato.has(f.id)).length,
      esteMes:     all.filter((f) => {
        const d = new Date(f.criadoEm)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      }).length,
    }
  }, [summaryData, contratosGlobais])

  const listaCarregando = isLoading
  const listaAtualizando = isPlaceholderData
  const resumoCarregando = (resumoListaCarregando && !summaryData) || (contratosResumoCarregando && !contratosGlobais)

  const openCreate = () => {
    setEditingFornecedor(null)
    setFormOpen(true)
  }
  const openEdit = (f: Fornecedor) => {
    setEditingFornecedor(f)
    setFormOpen(true)
  }
  const handleDelete = (f: Fornecedor) => {
    setPendingDelete(f)
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success("Fornecedor removido com sucesso")
        setPendingDelete(null)
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, "Erro ao remover"))
        setPendingDelete(null)
      },
    })
  }
  const handleFormSubmit = (data: CreateFornecedorRequest) => {
    if (editingFornecedor) {
      updateMutation.mutate(
        { id: editingFornecedor.id, data },
        { onSuccess: () => setFormOpen(false) },
      )
    } else {
      createMutation.mutate(data, { onSuccess: () => setFormOpen(false) })
    }
  }

  // ── Error ───────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Truck className="text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Erro ao carregar fornecedores</h3>
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fornecedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestão centralizada de parceiros e prestadores de serviço.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {resumoCarregando
          ? SUMMARY_CARDS.map((card) => (
              <KpiCardSkeleton key={card.key} />
            ))
          : SUMMARY_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.key} className="rounded-2xl bg-card p-3 ring-1 ring-border sm:p-5">
              <div className="flex items-center gap-3">
                <div className={`shrink-0 rounded-lg p-2 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground">{summaryValues[card.key]}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <ListSortMenu
          columns={SORT_COLUMNS}
          sort={sort}
          dir={dir}
          onChange={(nextSortKey, nextDir) => {
            setSort(nextSortKey)
            setDir(nextDir)
            setPage(1)
          }}
        />
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            autoComplete="off"
            spellCheck={false}
            aria-label="Buscar fornecedores"
            className="pl-10"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* Table */}
      {!listaCarregando && fornecedorList.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nenhum fornecedor encontrado"
          description="Cadastre o primeiro fornecedor."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Cadastrar Fornecedor
            </Button>
          }
        />
      ) : (
        <ListBusy busy={listaAtualizando} className="space-y-4">
          {listaCarregando ? (
            <ListSkeletonCards />
          ) : (
          <div className="space-y-3 lg:hidden">
            {fornecedorList.map((f) => {
              const servicos = f.servicos ?? []
              return (
                <ListRecord
                  key={f.id}
                  title={f.nome}
                  onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                  fields={[
                    { label: "CNPJ", value: f.cnpj || "-" },
                    { label: "Contato", value: f.nomeContato || "-" },
                    { label: "Telefone", value: f.telefone || "-" },
                    { label: "Email", value: f.email || "-" },
                    {
                      label: "Serviços",
                      value: servicos.length
                        ? servicos.map((s) => s.tipo.replace(/_/g, " ")).join(", ")
                        : "-",
                    },
                  ]}
                  actions={
                    <>
                      <ListRecordButton icon={Pencil} onClick={() => openEdit(f)}>
                        Editar
                      </ListRecordButton>
                      <ListRecordButton icon={Trash2} tone="danger" onClick={() => handleDelete(f)}>
                        Excluir
                      </ListRecordButton>
                    </>
                  }
                  primaryAction={
                    <ListRecordButton
                      icon={expandedId === f.id ? EyeOff : Eye}
                      onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                    >
                      {expandedId === f.id ? "Ocultar" : "Detalhes"}
                    </ListRecordButton>
                  }
                >
                  {expandedId === f.id ? <FornecedorExpandido fornecedorId={f.id} /> : null}
                </ListRecord>
              )
            })}
          </div>
          )}
          <ListPanel className="hidden lg:block">
            <Table
              columns={listColumns(
                listFlex("8rem", "16rem"),
                listColumn.cnpj,
                listFlex("6rem", "10rem"),
                listColumn.phone,
                listFlex("10rem", "16rem"),
                listFlex("7rem", "12rem"),
                listColumn.actions3,
              )}
            >
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableHead label="Nome" column="nome" sort={sort} dir={dir} onSort={sortBy} />
                  <SortableHead label="CNPJ" column="cnpj" sort={sort} dir={dir} onSort={sortBy} />
                  <TableHead>Contato</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCarregando ? (
                  <ListSkeletonRows columns={7} />
                ) : fornecedorList.map((f) => {
                  const servicos = f.servicos ?? []
                  return (
                  <Fragment key={f.id}>
                    <TableRow
                      className="cursor-pointer transition-colors hover:bg-muted/60"
                      onClick={() =>
                        setExpandedId(expandedId === f.id ? null : f.id)
                      }
                    >
                      <TableCell className="truncate font-medium text-foreground" title={f.nome}>{f.nome}</TableCell>
                      <TableCell className="truncate text-gray-500">{f.cnpj || "-"}</TableCell>
                      <TableCell className="truncate text-gray-600" title={f.nomeContato || undefined}>{f.nomeContato || "-"}</TableCell>
                      <TableCell className="truncate text-gray-500" title={f.telefone || undefined}>{f.telefone || "-"}</TableCell>
                      <TableCell className="truncate text-gray-500" title={f.email || undefined}>{f.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {servicos.slice(0, 2).map((s) => (
                            <Badge key={s.id} variant="secondary" className="text-xs">
                              {s.tipo.replace(/_/g, " ")}
                            </Badge>
                          ))}
                          {servicos.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{servicos.length - 2}
                            </Badge>
                          )}
                          {servicos.length === 0 && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <RowActions
                          collapse
                          items={[
                            {
                              label: "Ver detalhes",
                              icon: Eye,
                              onClick: () => setExpandedId(expandedId === f.id ? null : f.id),
                            },
                            {
                              label: "Editar",
                              icon: Pencil,
                              onClick: () => openEdit(f),
                            },
                            {
                              label: "Excluir",
                              icon: Trash2,
                              destructive: true,
                              buttonClassName: "text-red-500 hover:text-red-700",
                              onClick: () => handleDelete(f),
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                    {expandedId === f.id && (
                      <TableRow key={`${f.id}-expand`}>
                        <TableCell colSpan={7} aria-colspan={7} className="p-0">
                          <FornecedorExpandido fornecedorId={f.id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </ListPanel>
          {!listaCarregando && totalCount != null && (
            <ListPagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              singular="fornecedor"
              pluralLabel="fornecedores"
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          )}
        </ListBusy>
      )}

      {/* Form dialog */}
      <FornecedorForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingFornecedor(null)
        }}
        fornecedor={editingFornecedor}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Remover fornecedor"
        description={`Tem certeza que deseja remover "${pendingDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}

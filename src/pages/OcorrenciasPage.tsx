import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Plus, Search, AlertTriangle, RefreshCw, Eye, Bell, Clock, CheckCircle2, XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import Combobox from "@/components/shared/Combobox"
import EmptyState from "@/components/shared/EmptyState"
import ListPagination from "@/components/shared/ListPagination"
import ListPanel from "@/components/shared/ListPanel"
import ListRecord from "@/components/shared/ListRecord"
import { KpiCardSkeleton } from "@/components/shared/KpiCardSkeleton"
import { ListSkeletonCards, ListSkeletonRows } from "@/components/shared/ListSkeleton"
import ListSortMenu from "@/components/shared/ListSortMenu"
import SortableHead from "@/components/shared/SortableHead"
import { nextSort, type SortColumn, type SortDir } from "@/lib/list-sort"
import { useOcorrencias, useCreateOcorrencia } from "@/features/ocorrencias/hooks/useOcorrencias"
import OcorrenciaStatusBadge from "@/features/ocorrencias/components/OcorrenciaStatusBadge"
import OcorrenciaForm from "@/features/ocorrencias/components/OcorrenciaForm"
import type {
  OcorrenciaStatus, OcorrenciaTipo, OcorrenciaOrigem, CreateOcorrenciaRequest,
} from "@/features/ocorrencias/types/ocorrencia.types"
import {
  TIPO_LABEL, ORIGEM_LABEL, TIPO_LOCAL_LABEL,
} from "@/features/ocorrencias/types/ocorrencia.types"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { useDebounce } from "@/hooks/useDebounce"
import { cn } from "@/lib/utils"

const SUMMARY_CARDS = [
  { key: "nova",        label: "Novas",       icon: Bell,          color: "text-amber-600 bg-amber-50"    },
  { key: "em_andamento",label: "Em Andamento", icon: Clock,         color: "text-blue-600 bg-blue-50"      },
  { key: "finalizada",  label: "Finalizadas",  icon: CheckCircle2,  color: "text-emerald-600 bg-emerald-50"},
  { key: "cancelada",   label: "Canceladas",   icon: XCircle,       color: "text-gray-500 bg-gray-100"     },
] as const

const SORT_COLUMNS: SortColumn[] = [
  { key: "status", label: "Status" },
  { key: "tipo", label: "Tipo" },
  { key: "origem", label: "Origem" },
  { key: "local", label: "Local" },
  { key: "data", label: "Data" },
]

export default function OcorrenciasPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<OcorrenciaStatus | "">("")
  const [tipoFilter, setTipoFilter] = useState<OcorrenciaTipo | "">("")
  const [origemFilter, setOrigemFilter] = useState<OcorrenciaOrigem | "">("")
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string>()
  const [dir, setDir] = useState<SortDir>()

  const condominioId = useCondominioScopeStore((s) => s.selectedCondominioId) ?? ""
  const condoConfigured = !!condominioId

  const debouncedSearch = useDebounce(search)

  const filters = useMemo(() => ({
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(statusFilter ? { status: statusFilter as OcorrenciaStatus } : {}),
    ...(tipoFilter ? { tipoOcorrencia: tipoFilter as OcorrenciaTipo } : {}),
    ...(origemFilter ? { origem: origemFilter as OcorrenciaOrigem } : {}),
    page,
    pageSize: 20,
    sort,
    dir,
  }), [debouncedSearch, statusFilter, tipoFilter, origemFilter, page, sort, dir])

  const sortBy = (column: string) => {
    const next = nextSort(sort, dir, column)
    setSort(next.sort)
    setDir(next.dir)
    setPage(1)
  }

  const { data: ocorrenciasPage, isLoading, isPlaceholderData, isError, refetch } = useOcorrencias(condominioId, filters)
  const {
    data: summaryData,
    isLoading: resumoInicial,
    isPlaceholderData: resumoTrocando,
  } = useOcorrencias(condominioId, { pageSize: 500 })
  const createMutation = useCreateOcorrencia()

  const handleCreate = (data: CreateOcorrenciaRequest) => {
    createMutation.mutate(data, {
      onSuccess: (created) => {
        setFormOpen(false)
        navigate(`/ocorrencias/${created.id}`)
      },
    })
  }

  const ocList = ocorrenciasPage?.data ?? []
  const totalCount = ocorrenciasPage?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / 20))

  const statusCounts = useMemo(() => {
    const summaryList = summaryData?.data ?? []
    return {
      nova: summaryList.filter((o) => o.status === "nova").length,
      em_andamento: summaryList.filter((o) => o.status === "em_andamento").length,
      finalizada: summaryList.filter((o) => o.status === "finalizada").length,
      cancelada: summaryList.filter((o) => o.status === "cancelada").length,
    }
  }, [summaryData?.data])

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
        <h2 className="text-lg font-semibold text-foreground">Erro ao carregar ocorrências</h2>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    )
  }

  const listaCarregando = condoConfigured && (isLoading || isPlaceholderData)
  const resumoCarregando = condoConfigured && (resumoInicial || resumoTrocando)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ocorrências</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie e acompanhe as ocorrências registradas.</p>
        </div>
        <Button
          
          disabled={!condoConfigured}
          onClick={() => setFormOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Nova Ocorrência
        </Button>
      </div>

      {!condoConfigured && (
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
          Selecione um condomínio na barra lateral para listar e registrar ocorrências. Cadastre em{" "}
          <Link
            to="/condominios"
            className="font-medium text-emerald-800 underline underline-offset-2"
          >
            Condomínios
          </Link>
          .
        </div>
      )}

      {/* Summary cards */}
      {condoConfigured && (
      <div>
        <p className="mb-2 text-sm text-muted-foreground">
          Selecione um resumo para filtrar a lista.
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {resumoCarregando ? (
            SUMMARY_CARDS.map((card) => (
              <KpiCardSkeleton key={card.key} />
            ))
          ) : SUMMARY_CARDS.map((card) => {
            const Icon = card.icon
            const selected = statusFilter === card.key
            return (
              <button
                key={card.key}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setStatusFilter(selected ? "" : card.key)
                  setPage(1)
                }}
                className={cn(
                  "rounded-2xl bg-card p-3 text-left ring-1 ring-border shadow-[0_1px_2px_hsl(150_20%_10%/0.04)] sm:p-5",
                  "transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
                  "hover:-translate-y-0.5 hover:shadow-[0_10px_24px_hsl(150_20%_10%/0.06)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                  selected && "ring-2 ring-primary",
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn("shrink-0 rounded-lg p-2", card.color)}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-muted-foreground">{card.label}</span>
                    <span className="block text-2xl font-semibold tabular-nums text-foreground">
                      {statusCounts[card.key]}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
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
            aria-label="Buscar ocorrências"
            className="pl-10"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Combobox
          options={[
            { value: "", label: "Todos os status" },
            { value: "nova", label: "Nova" },
            { value: "em_andamento", label: "Em Andamento" },
            { value: "finalizada", label: "Finalizada" },
            { value: "cancelada", label: "Cancelada" },
          ]}
          value={statusFilter || ""}
          onValueChange={(v) => { setStatusFilter(v as OcorrenciaStatus | ""); setPage(1) }}
          placeholder="Buscar…"
          className="w-full min-w-0 md:w-44"
        />
        <Combobox
          options={[
            { value: "", label: "Todos os tipos" },
            ...Object.entries(TIPO_LABEL).map(([k, v]) => ({ value: k, label: v })),
          ]}
          value={tipoFilter || ""}
          onValueChange={(v) => { setTipoFilter(v as OcorrenciaTipo | ""); setPage(1) }}
          placeholder="Buscar…"
          className="w-full min-w-0 md:w-44"
        />
        <Combobox
          options={[
            { value: "", label: "Todas as origens" },
            ...Object.entries(ORIGEM_LABEL).map(([k, v]) => ({ value: k, label: v })),
          ]}
          value={origemFilter || ""}
          onValueChange={(v) => { setOrigemFilter(v as OcorrenciaOrigem | ""); setPage(1) }}
          placeholder="Buscar…"
          className="w-full min-w-0 md:w-44"
        />
      </div>

      {!listaCarregando && ocList.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="Nenhuma ocorrência encontrada"
          description="Registre a primeira ocorrência do condomínio."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Nova Ocorrência
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {listaCarregando ? (
            <ListSkeletonCards />
          ) : (
            <div className="space-y-3 md:hidden">
              {ocList.map((o) => (
                <ListRecord
                  key={o.id}
                  title={TIPO_LABEL[o.tipoOcorrencia]}
                  onClick={() => navigate(`/ocorrencias/${o.id}`)}
                  fields={[
                    { label: "Status", value: <OcorrenciaStatusBadge status={o.status} /> },
                    { label: "Origem", value: ORIGEM_LABEL[o.origem] },
                    { label: "Local", value: TIPO_LOCAL_LABEL[o.tipoLocal] },
                    { label: "Descrição", value: o.descricao.slice(0, 150) },
                    { label: "Data", value: new Date(o.ocorreuEm).toLocaleDateString("pt-BR") },
                  ]}
                  actions={
                    <Button
                      variant="outline"
                      className="min-h-11"
                      onClick={() => navigate(`/ocorrencias/${o.id}`)}
                    >
                      Abrir
                    </Button>
                  }
                />
              ))}
            </div>
          )}
          <ListPanel className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableHead label="Status" column="status" sort={sort} dir={dir} onSort={sortBy} className="w-[12%]" />
                  <SortableHead label="Tipo" column="tipo" sort={sort} dir={dir} onSort={sortBy} className="w-[12%]" />
                  <SortableHead label="Origem" column="origem" sort={sort} dir={dir} onSort={sortBy} className="w-[15%]" />
                  <SortableHead label="Local" column="local" sort={sort} dir={dir} onSort={sortBy} className="w-[15%]" />
                  <TableHead className="w-[24%]">Descrição</TableHead>
                  <SortableHead label="Data" column="data" sort={sort} dir={dir} onSort={sortBy} className="w-[13%]" />
                  <TableHead className="w-[9%]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCarregando ? (
                  <ListSkeletonRows columns={7} />
                ) : ocList.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer transition-colors hover:bg-muted/60"
                    onClick={() => navigate(`/ocorrencias/${o.id}`)}
                  >
                    <TableCell><OcorrenciaStatusBadge status={o.status} /></TableCell>
                    <TableCell className="truncate font-medium">{TIPO_LABEL[o.tipoOcorrencia]}</TableCell>
                    <TableCell className="truncate">{ORIGEM_LABEL[o.origem]}</TableCell>
                    <TableCell className="truncate">{TIPO_LOCAL_LABEL[o.tipoLocal]}</TableCell>
                    <TableCell className="truncate text-sm text-gray-600">{o.descricao.slice(0, 150)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(o.ocorreuEm).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label="Abrir ocorrência" onClick={(e) => { e.stopPropagation(); navigate(`/ocorrencias/${o.id}`) }}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ListPanel>
          {!listaCarregando && (
            <ListPagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              singular="ocorrência"
              pluralLabel="ocorrências"
              onPage={setPage}
            />
          )}
        </div>
      )}

      {/* Form */}
      <OcorrenciaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        condominioId={condominioId}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />
    </div>
  )
}

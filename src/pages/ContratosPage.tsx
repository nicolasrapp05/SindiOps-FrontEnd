import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Plus,
  Search,
  FileText,
  Pencil,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Ban,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Combobox from "@/components/shared/Combobox"
import ConfirmDialog from "@/components/shared/ConfirmDialog"
import EmptyState from "@/components/shared/EmptyState"
import ListPagination from "@/components/shared/ListPagination"
import ListPanel from "@/components/shared/ListPanel"
import ListRecord from "@/components/shared/ListRecord"
import ListRecordButton from "@/components/shared/ListRecordButton"
import { KpiCardSkeleton } from "@/components/shared/KpiCardSkeleton"
import { ListSkeletonCards, ListSkeletonRows } from "@/components/shared/ListSkeleton"
import ListSortMenu from "@/components/shared/ListSortMenu"
import SortableHead from "@/components/shared/SortableHead"
import { nextSort, type SortColumn, type SortDir } from "@/lib/list-sort"
import {
  useContratos,
  useCreateContrato,
  useUpdateContrato,
  useCancelarContrato,
  useReativarContrato,
} from "@/features/contratos/hooks/useContratos"
import type { Contrato, ContratoStatus, CreateContratoRequest } from "@/features/contratos/types/contrato.types"
import { TIPO_SERVICO_LABEL } from "@/features/contratos/types/contrato.types"
import ContratoForm from "@/features/contratos/components/ContratoForm"
import ContratoStatusBadge from "@/features/contratos/components/ContratoStatusBadge"
import {
  CONTRATO_STATUS_FILTER_OPTIONS,
  contratoRowHighlightClass,
  podeCancelarContrato,
  podeReativarContrato,
} from "@/features/contratos/lib/contrato-status"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { useDebounce } from "@/hooks/useDebounce"
import { formatBRL } from "@/lib/currency"

const PAGE_SIZE = 20

const SUMMARY_CARDS = [
  { key: "active",    label: "Vigentes",   icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  { key: "expiring",  label: "Expirando",  icon: Clock,        color: "text-orange-600 bg-orange-50"   },
  { key: "expired",   label: "Expirados",  icon: AlertCircle,  color: "text-red-600 bg-red-50"         },
  { key: "cancelled", label: "Cancelados", icon: XCircle,      color: "text-gray-500 bg-gray-100"      },
] as const

const SORT_COLUMNS: SortColumn[] = [
  { key: "status", label: "Status" },
  { key: "tipo", label: "Tipo de serviço" },
  { key: "fornecedor", label: "Fornecedor" },
  { key: "inicio", label: "Início" },
  { key: "termino", label: "Término" },
  { key: "valor", label: "Valor mensal" },
]

function formatDate(iso?: string): string {
  if (!iso) return "-"
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR")
}

export default function ContratosPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ContratoStatus>("all")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string>()
  const [dir, setDir] = useState<SortDir>()
  const [formOpen, setFormOpen] = useState(false)
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null)
  const [pendingCancel, setPendingCancel] = useState<Contrato | null>(null)

  const condominioId = useCondominioScopeStore((s) => s.selectedCondominioId) ?? ""
  const condominioNome = useCondominioScopeStore((s) => s.selectedCondominioNome) ?? ""
  const condoConfigured = !!condominioId

  const debouncedSearch = useDebounce(search)

  const tableFilters = {
    search: debouncedSearch.trim() || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    pageSize: PAGE_SIZE,
    sort,
    dir,
  }

  const sortBy = (column: string) => {
    const next = nextSort(sort, dir, column)
    setSort(next.sort)
    setDir(next.dir)
    setPage(1)
  }

  const summaryFilters = { page: 1, pageSize: 2000 }

  const { data: contratosRaw, isLoading, isPlaceholderData, isError, refetch } = useContratos(condominioId, tableFilters)
  const {
    data: contratosSummaryRaw,
    isLoading: resumoInicial,
    isPlaceholderData: resumoTrocando,
  } = useContratos(condominioId, summaryFilters)

  const createMutation = useCreateContrato()
  const updateMutation = useUpdateContrato()
  const cancelMutation = useCancelarContrato()
  const reativarMutation = useReativarContrato()

  const contratoList = contratosRaw?.data ?? []
  const totalCount = contratosRaw?.totalCount
  const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 1

  const statusCounts = useMemo(
    () => {
      const summaryList = contratosSummaryRaw?.data ?? []
      return {
        active: summaryList.filter((c) => c.status === "active").length,
        expiring: summaryList.filter((c) => c.status === "expiring").length,
        expired: summaryList.filter((c) => c.status === "expired").length,
        cancelled: summaryList.filter((c) => c.status === "cancelled").length,
      }
    },
    [contratosSummaryRaw?.data],
  )

  const listaCarregando = condoConfigured && (isLoading || isPlaceholderData)
  const resumoCarregando = condoConfigured && (resumoInicial || resumoTrocando)

  const openCreate = () => {
    setEditingContrato(null)
    setFormOpen(true)
  }

  const openEdit = (c: Contrato) => {
    setEditingContrato(c)
    setFormOpen(true)
  }

  const handleFormSubmit = (data: CreateContratoRequest) => {
    if (editingContrato) {
      updateMutation.mutate(
        { id: editingContrato.id, data },
        { onSuccess: () => setFormOpen(false) },
      )
    } else {
      createMutation.mutate(data, { onSuccess: () => setFormOpen(false) })
    }
  }

  const handleConfirmCancel = () => {
    if (!pendingCancel) return
    cancelMutation.mutate(pendingCancel.id, {
      onSuccess: () => setPendingCancel(null),
    })
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <FileText className="text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Erro ao carregar contratos</h3>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contratos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Contratos de serviços do condomínio - fornecedores, vigência e valores.
          </p>
        </div>
        <Button
          
          disabled={!condoConfigured}
          onClick={openCreate}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      {!condoConfigured && (
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
          Selecione um condomínio na barra lateral para carregar contratos. Cadastre condomínios em{" "}
          <Link
            to="/condominios"
            className="font-medium text-emerald-800 underline underline-offset-2"
          >
            Condomínios
          </Link>
          .
        </div>
      )}

      {condoConfigured && (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {resumoCarregando ? (
          SUMMARY_CARDS.map((card) => (
            <KpiCardSkeleton key={card.key} />
          ))
        ) : SUMMARY_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.key} className="rounded-2xl bg-card p-3 ring-1 ring-border sm:p-5">
              <div className="flex items-center gap-3">
                <div className={`shrink-0 rounded-lg p-2 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground">{statusCounts[card.key]}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

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
            aria-label="Buscar contratos"
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
          options={CONTRATO_STATUS_FILTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v as "all" | ContratoStatus); setPage(1) }}
          placeholder="Buscar…"
          className="w-full min-w-0 md:w-[200px]"
        />
      </div>

      {!listaCarregando && contratoList.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum contrato encontrado"
          description="Cadastre o primeiro contrato de serviço."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Novo Contrato
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {listaCarregando ? (
            <ListSkeletonCards />
          ) : (
          <div className="space-y-3 md:hidden">
            {contratoList.map((c) => {
              const contato =
                [c.nomeContato, c.telefoneContato].filter(Boolean).join(" · ") || "-"
              const actionBusy =
                (cancelMutation.isPending && cancelMutation.variables === c.id) ||
                (reativarMutation.isPending && reativarMutation.variables === c.id)
              return (
                <ListRecord
                  key={c.id}
                  className={contratoRowHighlightClass(c.status)}
                  title={TIPO_SERVICO_LABEL[c.tipoServico]}
                  fields={[
                    { label: "Status", value: <ContratoStatusBadge status={c.status} /> },
                    { label: "Fornecedor", value: c.fornecedor.nome },
                    { label: "Contato", value: contato },
                    { label: "Início", value: formatDate(c.dataInicio) },
                    { label: "Término", value: formatDate(c.dataFim) },
                    { label: "Valor mensal", value: c.valorMensal != null ? formatBRL(c.valorMensal) : "-" },
                  ]}
                  actions={
                    <>
                      {podeCancelarContrato(c.status) && (
                        <ListRecordButton
                          icon={Ban}
                          tone="danger"
                          disabled={actionBusy}
                          onClick={() => setPendingCancel(c)}
                        >
                          Cancelar
                        </ListRecordButton>
                      )}
                      {podeReativarContrato(c.status) && (
                        <ListRecordButton icon={Pencil} onClick={() => openEdit(c)}>
                          Editar
                        </ListRecordButton>
                      )}
                    </>
                  }
                  primaryAction={
                    podeReativarContrato(c.status) ? (
                      <ListRecordButton
                        icon={RotateCcw}
                        tone="success"
                        disabled={actionBusy}
                        onClick={() => reativarMutation.mutate(c.id)}
                      >
                        Reativar
                      </ListRecordButton>
                    ) : (
                      <ListRecordButton icon={Pencil} onClick={() => openEdit(c)}>
                        Editar
                      </ListRecordButton>
                    )
                  }
                />
              )
            })}
          </div>
          )}
          <ListPanel className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableHead label="Status" column="status" sort={sort} dir={dir} onSort={sortBy} className="w-[10%]" />
                  <SortableHead label="Tipo de serviço" column="tipo" sort={sort} dir={dir} onSort={sortBy} className="w-[12%]" />
                  <SortableHead label="Fornecedor" column="fornecedor" sort={sort} dir={dir} onSort={sortBy} className="w-[13%]" />
                  <TableHead className="w-[12%]">Contato</TableHead>
                  <SortableHead label="Início" column="inicio" sort={sort} dir={dir} onSort={sortBy} className="w-[10%]" />
                  <SortableHead label="Término" column="termino" sort={sort} dir={dir} onSort={sortBy} className="w-[10%]" />
                  <SortableHead label="Valor mensal" column="valor" sort={sort} dir={dir} onSort={sortBy} className="w-[12%]" />
                  <TableHead className="w-[21%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCarregando ? (
                  <ListSkeletonRows columns={8} />
                ) : contratoList.map((c) => {
                  const contato =
                    [c.nomeContato, c.telefoneContato].filter(Boolean).join(" · ") || "-"
                  const actionBusy =
                    (cancelMutation.isPending && cancelMutation.variables === c.id) ||
                    (reativarMutation.isPending && reativarMutation.variables === c.id)
                  const rowHighlight = contratoRowHighlightClass(c.status)
                  return (
                    <TableRow
                      key={c.id}
                      className={rowHighlight}
                    >
                      <TableCell>
                        <ContratoStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="truncate font-medium text-foreground">
                        {TIPO_SERVICO_LABEL[c.tipoServico]}
                      </TableCell>
                      <TableCell className="truncate text-gray-700">{c.fornecedor.nome}</TableCell>
                      <TableCell className="truncate text-gray-600">{contato}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(c.dataInicio)}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(c.dataFim)}</TableCell>
                      <TableCell className="text-gray-700">
                        {c.valorMensal != null ? formatBRL(c.valorMensal) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {podeCancelarContrato(c.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground"
                              disabled={actionBusy}
                              onClick={() => setPendingCancel(c)}
                            >
                              <Ban className="mr-1.5 h-3.5 w-3.5" />
                              Cancelar
                            </Button>
                          )}
                          {podeReativarContrato(c.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-emerald-700"
                              disabled={actionBusy}
                              onClick={() => reativarMutation.mutate(c.id)}
                            >
                              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                              Reativar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            
                            onClick={() => openEdit(c)}
                           aria-label="Editar">
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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
              singular="contrato"
              pluralLabel="contratos"
              onPage={setPage}
            />
          )}
        </div>
      )}

      <ContratoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        condominioId={condominioId}
        condominioNome={condominioNome}
        contrato={editingContrato}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!pendingCancel}
        onOpenChange={(open) => !open && setPendingCancel(null)}
        title="Cancelar contrato"
        description={`Tem certeza que deseja cancelar o contrato de ${TIPO_SERVICO_LABEL[pendingCancel?.tipoServico ?? "outro"]} com ${pendingCancel?.fornecedor.nome ?? "este fornecedor"}? O status vigente, expirando e expirado continuará sendo calculado pela data de término após reativar.`}
        confirmLabel="Cancelar contrato"
        onConfirm={handleConfirmCancel}
        isPending={cancelMutation.isPending}
      />
    </div>
  )
}

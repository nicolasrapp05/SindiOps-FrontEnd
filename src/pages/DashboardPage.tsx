import { useState, useMemo } from "react"
import {
  AlertTriangle,
  Clock,
  MessageSquareWarning,
  ShoppingCart,
  FileText,
  CalendarDays,
  Download,
  RefreshCw,
  Inbox,
  Loader2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import {
  condominioIdDaConsulta,
  escopoCondominioAtivo,
  isTodosCondominios,
} from "@/lib/condominio-scope"
import { useDashboard } from "@/features/dashboard/hooks/useDashboard"
import { useGerarRelatorio } from "@/features/relatorios/hooks/useRelatorios"
import type { AgendaItem } from "@/features/dashboard/types/dashboard.types"
import type { AlertaColor } from "@/features/dashboard/components/AlertaCard"
import {
  canExportRelatorios,
  canSeeAgendaTipo,
  canSeeDashboardAlert,
  type DashboardAlertKey,
} from "@/lib/cargo-permissions"
import {
  MANUTENCAO_TIPO_LABEL,
  type ManutencaoTipo,
} from "@/features/manutencoes/types/manutencao-obrigatoria.types"
import type { UserCargo } from "@/types"
import AlertaCard from "@/features/dashboard/components/AlertaCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import ListPagination from "@/components/shared/ListPagination"
import { DEFAULT_PAGE_SIZE, type PageSizeOption } from "@/lib/pagination"
import ListRecord from "@/components/shared/ListRecord"
import { KpiCardSkeleton } from "@/components/shared/KpiCardSkeleton"
import { ListSkeletonCards, ListSkeletonRows } from "@/components/shared/ListSkeleton"
import ListSortMenu from "@/components/shared/ListSortMenu"
import SortableHead from "@/components/shared/SortableHead"
import { nextSort, type SortColumn, type SortDir } from "@/lib/list-sort"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const TIPO_LABELS: Record<AgendaItem["tipo"], string> = {
  manutencao_obrigatoria: "Manutenção",
  contrato: "Contrato",
  mandato: "Mandato",
}

const TIPO_COLORS: Record<AgendaItem["tipo"], string> = {
  manutencao_obrigatoria: "bg-orange-100 text-orange-700",
  contrato: "bg-purple-100 text-purple-700",
  mandato: "bg-blue-100 text-blue-700",
}

const STATUS_COLORS: Record<string, string> = {
  overdue: "bg-red-100 text-red-700",
  vencida: "bg-red-100 text-red-700",
  upcoming: "bg-amber-100 text-amber-700",
  proxima: "bg-amber-100 text-amber-700",
  expiring: "bg-orange-100 text-orange-700",
  ok: "bg-green-100 text-green-700",
}

function formatFullDate(): string {
  const now = new Date()
  return now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatDescricao(item: AgendaItem): string {
  if (item.tipo === "manutencao_obrigatoria") {
    return MANUTENCAO_TIPO_LABEL[item.descricao as ManutencaoTipo] ?? item.descricao
  }
  return item.descricao
}

function formatPrazo(iso: string): string {
  const date = new Date(iso + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000)
  const formatted = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
  if (diff < 0) {
    const days = Math.abs(diff)
    return `${formatted}, há ${days} ${days === 1 ? "dia" : "dias"}`
  }
  if (diff === 0) return `${formatted}, hoje`
  if (diff <= 14) return `${formatted}, em ${diff} ${diff === 1 ? "dia" : "dias"}`
  return date.toLocaleDateString("pt-BR")
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    overdue: "Vencida",
    vencida: "Vencida",
    upcoming: "Próxima",
    proxima: "Próxima",
    expiring: "Expirando",
    ok: "Em dia",
  }
  return map[status] ?? capitalizeFirst(status)
}

// ── Error state ───────────────────────────────────────────────────────

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-red-50 p-4">
        <AlertTriangle className="text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        Erro ao carregar o dashboard
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Não foi possível buscar os dados. Verifique sua conexão e tente
        novamente.
      </p>
      <Button variant="outline" className="mt-6" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────

type TipoFilter = "all" | AgendaItem["tipo"]
type StatusFilter = "all" | string

const TIPO_FILTER_OPTIONS: { value: TipoFilter; label: string }[] = [
  { value: "all", label: "Todos os tipos" },
  { value: "manutencao_obrigatoria", label: "Manutenção" },
  { value: "contrato", label: "Contrato" },
  { value: "mandato", label: "Mandato" },
]

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos os status" },
  { value: "overdue", label: "Vencida" },
  { value: "upcoming", label: "Próxima" },
  { value: "expiring", label: "Expirando" },
  { value: "ok", label: "Em dia" },
]

const ALERTA_DEFS: {
  key: DashboardAlertKey
  titulo: string
  icone: LucideIcon
  cor: AlertaColor
  href: string
}[] = [
  {
    key: "manutencoesVencidas",
    titulo: "Manutenções Vencidas",
    icone: AlertTriangle,
    cor: "red",
    href: "/manutencoes-obrigatorias",
  },
  {
    key: "manutencoesProximas",
    titulo: "Manutenções Próximas",
    icone: Clock,
    cor: "orange",
    href: "/manutencoes-obrigatorias",
  },
  {
    key: "ocorrenciasAbertas",
    titulo: "Ocorrências Abertas",
    icone: MessageSquareWarning,
    cor: "blue",
    href: "/ocorrencias",
  },
  {
    key: "comprasPendentes",
    titulo: "Compras Pendentes",
    icone: ShoppingCart,
    cor: "yellow",
    href: "/compras",
  },
  {
    key: "contratosVencendo",
    titulo: "Contratos a Vencer",
    icone: FileText,
    cor: "purple",
    href: "/contratos",
  },
]

function FilterChips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-11 rounded-full px-3 text-sm font-medium transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

const GRADE_ALERTAS =
  "grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] gap-3"

const AGENDA_SORT_COLUMNS: SortColumn[] = [
  { key: "tipo", label: "Tipo" },
  { key: "condominio", label: "Condomínio" },
  { key: "vencimento", label: "Vencimento" },
  { key: "status", label: "Status" },
]

function getTipoFilterOptions(cargo: UserCargo | null | undefined) {
  return TIPO_FILTER_OPTIONS.filter(
    (option) => option.value === "all" || canSeeAgendaTipo(cargo, option.value as AgendaItem["tipo"]),
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const cargo = user?.cargo
  const selectedCondominioId = useCondominioScopeStore((s) => s.selectedCondominioId)
  const todos = isTodosCondominios(selectedCondominioId)
  const condominioConsulta = condominioIdDaConsulta(selectedCondominioId)
  const escopoAtivo = escopoCondominioAtivo(selectedCondominioId)

  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE)
  const [pageScope, setPageScope] = useState(selectedCondominioId)
  if (pageScope !== selectedCondominioId) {
    setPageScope(selectedCondominioId)
    setPage(1)
  }
  const [sort, setSort] = useState<string>()
  const [dir, setDir] = useState<SortDir>()

  const { data, isLoading, isError, refetch } = useDashboard({
    ...(condominioConsulta ? { condominioId: condominioConsulta } : {}),
    page,
    pageSize,
    sort,
    dir,
    tipo: tipoFilter === "all" ? undefined : tipoFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  })

  const sortBy = (column: string) => {
    const next = nextSort(sort, dir, column)
    setSort(next.sort)
    setDir(next.dir)
    setPage(1)
  }
  const exportar = useGerarRelatorio()

  const alertas = data?.alertas

  const visibleAlertas = useMemo(
    () => {
      if (!alertas) return []
      return ALERTA_DEFS.filter((def) => {
        if (!canSeeDashboardAlert(cargo, def.key)) return false
        return alertas[def.key] != null
      }).map((def) => ({
        ...def,
        valor: alertas[def.key] ?? 0,
      }))
    },
    [alertas, cargo],
  )

  const agenda = data?.agenda ?? []
  const agendaTotal = data?.agendaTotal ?? 0
  const agendaCount = data?.agendaCount ?? 0
  const agendaPages = Math.max(1, Math.ceil(agendaCount / pageSize))

  const tipoFilterOptions = useMemo(() => getTipoFilterOptions(cargo), [cargo])
  const alertasDoCargo = useMemo(
    () => ALERTA_DEFS.filter((def) => canSeeDashboardAlert(cargo, def.key)),
    [cargo],
  )
  const resumoCarregando = isLoading && !data
  const listaCarregando = isLoading

  if (isError && !data) return <DashboardError onRetry={() => refetch()} />

  const handleExportar = () => {
    if (!escopoAtivo) return
    exportar.mutate({
      tipo: "agenda_prazos",
      ...(condominioConsulta ? { condominioId: condominioConsulta } : {}),
      formato: "excel",
      filtros: {
        ...(tipoFilter !== "all" ? { tipo: tipoFilter } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      },
    })
  }

  const firstName = user?.nome?.split(" ")[0] ?? "Usuário"
  const pendencias = visibleAlertas.reduce((total, alerta) => total + alerta.valor, 0)
  const prazosAgenda = agendaTotal
  const resumoAtencao =
    pendencias === 0 && prazosAgenda === 0
      ? todos
        ? "Nada urgente nos condomínios."
        : "Nada urgente neste condomínio."
      : pendencias === 0 && prazosAgenda === 1
        ? "1 prazo na agenda."
        : pendencias === 0
          ? `${prazosAgenda} prazos na agenda.`
          : pendencias === 1
            ? "1 item pede atenção."
            : `${pendencias} itens pedem atenção.`

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Olá, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {capitalizeFirst(formatFullDate())}.{" "}
          {resumoCarregando ? (
            <Skeleton className="inline-block h-4 w-48 align-middle bg-card ring-1 ring-border" />
          ) : (
            resumoAtencao
          )}
        </p>
      </div>

      {/* Alert cards */}
      {resumoCarregando ? (
        alertasDoCargo.length > 0 ? (
          <div className={GRADE_ALERTAS}>
            {alertasDoCargo.map((alerta) => (
              <KpiCardSkeleton key={alerta.key} />
            ))}
          </div>
        ) : null
      ) : visibleAlertas.length > 0 ? (
        <div className={GRADE_ALERTAS}>
          {visibleAlertas.map((alerta) => (
            <AlertaCard
              key={alerta.key}
              titulo={alerta.titulo}
              valor={alerta.valor}
              icone={alerta.icone}
              cor={alerta.cor}
              href={alerta.href}
            />
          ))}
        </div>
      ) : null}

      {/* Agenda table */}
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-[0_1px_2px_hsl(150_20%_10%/0.04)] sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">
                Agenda de vencimentos
              </h2>
              <span className="text-sm tabular-nums text-muted-foreground">
                {resumoCarregando ? <Skeleton className="inline-block h-4 w-6 align-middle" /> : agendaCount}
              </span>
            </div>
            {canExportRelatorios(cargo) && (
              <div className="flex flex-col items-start gap-1">
              <Button
                variant="outline"
                size="sm"
                className="min-h-11"
                disabled={!escopoAtivo || exportar.isPending}
                onClick={handleExportar}
              >
                {exportar.isPending ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="mr-1.5 size-4" aria-hidden="true" />
                )}
                {exportar.isPending ? "Exportando…" : "Exportar"}
              </Button>
              {!escopoAtivo ? (
                <p className="text-sm text-muted-foreground">Selecione um condomínio</p>
              ) : null}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <ListSortMenu
              columns={AGENDA_SORT_COLUMNS}
              sort={sort}
              dir={dir}
              onChange={(nextSortKey, nextDir) => {
                setSort(nextSortKey)
                setDir(nextDir)
                setPage(1)
              }}
            />
            <FilterChips
              label="Filtrar por tipo"
              value={tipoFilter}
              options={tipoFilterOptions}
              onChange={(value) => {
                setTipoFilter(value)
                setPage(1)
              }}
            />
            <FilterChips
              label="Filtrar por status"
              value={statusFilter}
              options={STATUS_FILTER_OPTIONS}
              onChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            />
          </div>
        </div>

        {listaCarregando || agenda.length > 0 ? (
          <div className="mt-6 space-y-4">
          {listaCarregando ? (
            <ListSkeletonCards />
          ) : (
          <div className="space-y-3 md:hidden">
            {agenda.map((item, idx) => (
              <ListRecord
                key={`${item.referenciaId}-${idx}`}
                className={
                  item.status === "overdue" || item.status === "vencida" ? "bg-red-50/80" : undefined
                }
                title={formatDescricao(item)}
                fields={[
                  {
                    label: "Tipo",
                    value: (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TIPO_COLORS[item.tipo]}`}
                      >
                        {TIPO_LABELS[item.tipo]}
                      </span>
                    ),
                  },
                  { label: "Condomínio", value: item.condominioNome },
                  { label: "Vencimento", value: formatPrazo(item.dataVencimento) },
                  {
                    label: "Status",
                    value: (
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-700"}
                      >
                        {statusLabel(item.status)}
                      </Badge>
                    ),
                  },
                ]}
              />
            ))}
          </div>
          )}
          <div className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableHead label="Tipo" column="tipo" sort={sort} dir={dir} onSort={sortBy} className="w-[14%]" />
                  <TableHead className="w-[36%]">Descrição</TableHead>
                  <SortableHead label="Condomínio" column="condominio" sort={sort} dir={dir} onSort={sortBy} className="w-[20%]" />
                  <SortableHead label="Vencimento" column="vencimento" sort={sort} dir={dir} onSort={sortBy} className="w-[18%]" />
                  <SortableHead label="Status" column="status" sort={sort} dir={dir} onSort={sortBy} className="w-[12%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCarregando ? (
                  <ListSkeletonRows columns={5} />
                ) : agenda.map((item, idx) => (
                  <TableRow
                    key={`${item.referenciaId}-${idx}`}
                    className={cn(
                      item.status === "overdue" || item.status === "vencida"
                        ? "bg-red-50/80 hover:bg-red-50"
                        : undefined,
                    )}
                  >
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TIPO_COLORS[item.tipo]}`}
                      >
                        {TIPO_LABELS[item.tipo]}
                      </span>
                    </TableCell>
                    <TableCell className="truncate font-medium text-foreground">
                      {formatDescricao(item)}
                    </TableCell>
                    <TableCell className="truncate text-gray-500">
                      {item.condominioNome}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatPrazo(item.dataVencimento)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          STATUS_COLORS[item.status] ??
                          "bg-gray-100 text-gray-700"
                        }
                      >
                        {statusLabel(item.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!listaCarregando && (
          <ListPagination
            page={page}
            totalPages={agendaPages}
            totalCount={agendaCount}
            singular="prazo"
            pluralLabel="prazos"
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
          )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              {tipoFilter !== "all" || statusFilter !== "all"
                ? "Nenhum prazo com esses filtros."
                : "Nenhum vencimento programado"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {tipoFilter !== "all" || statusFilter !== "all"
                ? "Limpe os filtros para ver a agenda completa."
                : "Quando houver prazos, eles aparecem aqui em ordem de vencimento."}
            </p>
            {(tipoFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 min-h-11"
                onClick={() => {
                  setTipoFilter("all")
                  setStatusFilter("all")
                  setPage(1)
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

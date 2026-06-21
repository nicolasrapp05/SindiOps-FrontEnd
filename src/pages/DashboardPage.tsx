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
import Combobox from "@/components/shared/Combobox"
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

function formatDate(iso: string): string {
  const date = new Date(iso + "T00:00:00")
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
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

// ── Loading skeleton ──────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-52" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <Skeleton className="mb-6 h-6 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Error state ───────────────────────────────────────────────────────

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-red-50 p-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
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

function getTipoFilterOptions(cargo: UserCargo | null | undefined) {
  return TIPO_FILTER_OPTIONS.filter(
    (option) => option.value === "all" || canSeeAgendaTipo(cargo, option.value as AgendaItem["tipo"]),
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const cargo = user?.cargo
  const selectedCondominioId = useCondominioScopeStore((s) => s.selectedCondominioId)

  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const { data, isLoading, isError, refetch } = useDashboard(
    selectedCondominioId ?? undefined,
  )
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

  const sortedAgenda = useMemo(
    () => {
      const agenda = data?.agenda ?? []
      return [...agenda]
        .filter((item) => canSeeAgendaTipo(cargo, item.tipo))
        .sort(
          (a, b) =>
            new Date(a.dataVencimento).getTime() -
            new Date(b.dataVencimento).getTime(),
        )
        .filter((item) => tipoFilter === "all" || item.tipo === tipoFilter)
        .filter((item) => statusFilter === "all" || item.status === statusFilter)
    },
    [data?.agenda, cargo, tipoFilter, statusFilter],
  )

  const tipoFilterOptions = useMemo(() => getTipoFilterOptions(cargo), [cargo])

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) return <DashboardError onRetry={() => refetch()} />

  const handleExportar = () => {
    if (!selectedCondominioId) return
    exportar.mutate({
      tipo: "agenda_prazos",
      condominioId: selectedCondominioId,
      formato: "excel",
      filtros: {},
    })
  }

  const firstName = user?.nome?.split(" ")[0] ?? "Usuário"

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Olá, {firstName}. Aqui está o resumo de hoje.
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {capitalizeFirst(formatFullDate())}
        </p>
      </div>

      {/* Alert cards */}
      {visibleAlertas.length > 0 && (
        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
            visibleAlertas.length >= 4 ? "lg:grid-cols-3 xl:grid-cols-5" : "lg:grid-cols-3"
          }`}
        >
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
      )}

      {/* Agenda table */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Agenda de Vencimentos
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={
                !selectedCondominioId ||
                exportar.isPending ||
                !canExportRelatorios(cargo)
              }
              onClick={handleExportar}
            >
              {exportar.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              Exportar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Combobox
              options={tipoFilterOptions.map((o) => ({ value: o.value, label: o.label }))}
              value={tipoFilter}
              onValueChange={(v) => setTipoFilter(v as TipoFilter)}
              placeholder="Buscar…"
              className="w-[180px]"
            />
            <Combobox
              options={STATUS_FILTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              placeholder="Buscar…"
              className="w-[180px]"
            />
          </div>
        </div>

        {sortedAgenda.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-gray-100 p-3">
              <Inbox className="h-6 w-6 text-gray-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500">
              Nenhum vencimento programado
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Quando houver itens na agenda, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-32">Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Condomínio</TableHead>
                  <TableHead className="w-32">Vencimento</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAgenda.map((item, idx) => (
                  <TableRow
                    key={`${item.referenciaId}-${idx}`}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TIPO_COLORS[item.tipo]}`}
                      >
                        {TIPO_LABELS[item.tipo]}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-medium text-gray-900">
                      {formatDescricao(item)}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {item.condominioNome}
                    </TableCell>
                    <TableCell className="tabular-nums text-gray-600">
                      {formatDate(item.dataVencimento)}
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
        )}
      </div>
    </div>
  )
}

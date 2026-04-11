import {
  AlertTriangle,
  Clock,
  MessageSquareWarning,
  ShoppingCart,
  FileText,
  CalendarDays,
  Download,
  Filter,
  RefreshCw,
  Inbox,
} from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { useDashboard } from "@/features/dashboard/hooks/useDashboard"
import type { AgendaItem } from "@/features/dashboard/types/dashboard.types"
import AlertaCard from "@/features/dashboard/components/AlertaCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const selectedCondominioId = useCondominioScopeStore((s) => s.selectedCondominioId)
  const { data, isLoading, isError, refetch } = useDashboard(
    selectedCondominioId ?? undefined,
  )

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) return <DashboardError onRetry={() => refetch()} />

  const { alertas, agenda } = data
  const sortedAgenda = [...agenda].sort(
    (a, b) =>
      new Date(a.dataVencimento).getTime() -
      new Date(b.dataVencimento).getTime(),
  )

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <AlertaCard
          titulo="Manutenções Vencidas"
          valor={alertas.manutencoesVencidas}
          icone={AlertTriangle}
          cor="red"
          href="/manutencoes-obrigatorias"
        />
        <AlertaCard
          titulo="Manutenções Próximas"
          valor={alertas.manutencoesProximas}
          icone={Clock}
          cor="orange"
          href="/manutencoes-obrigatorias"
        />
        <AlertaCard
          titulo="Ocorrências Abertas"
          valor={alertas.ocorrenciasAbertas}
          icone={MessageSquareWarning}
          cor="blue"
          href="/ocorrencias"
        />
        <AlertaCard
          titulo="Compras Pendentes"
          valor={alertas.comprasPendentes}
          icone={ShoppingCart}
          cor="yellow"
          href="/compras"
        />
        <AlertaCard
          titulo="Contratos a Vencer"
          valor={alertas.contratosVencendo}
          icone={FileText}
          cor="purple"
          href="/contratos"
        />
      </div>

      {/* Agenda table */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Agenda de Vencimentos
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="mr-1.5 h-4 w-4" />
              Filtrar
            </Button>
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
                      {item.descricao}
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

import { Fragment, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Mail,
  Percent,
  RefreshCw,
  Search,
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
import DatePicker from "@/components/shared/DatePicker"
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
import { TemplateTipoBadge } from "@/features/comunicacao/components/TemplateTipoBadge"
import { TEMPLATE_TIPO_LABEL, type TemplateTipo } from "@/features/comunicacao/types/template.types"
import { StatusEntregaBadge } from "@/features/comunicacao/components/StatusEntregaBadge"
import { useEmailLogs, useEmailLog } from "@/features/comunicacao/hooks/useEmailLogs"
import type { EmailLog, StatusEntrega } from "@/features/comunicacao/types/email-log.types"
import { useDebounce } from "@/hooks/useDebounce"

function ExpandedLogRow({ logId, log }: { logId: string; log: EmailLog }) {
  const { data: detail } = useEmailLog(logId)
  const corpo = detail?.corpoResolvido ?? log.corpoResolvido
  return (
    <div className="bg-gray-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Detalhes do envio
      </p>
      <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-500">Enviado por</dt>
          <dd className="font-medium text-foreground">{log.enviadoPor.nome}</dd>
        </div>
        {log.template && (
          <div>
            <dt className="text-gray-500">Template</dt>
            <dd className="font-medium text-foreground">{log.template.nome}</dd>
          </div>
        )}
      </dl>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Pré-visualização do e-mail
      </p>
      <div className="mt-2 max-h-64 overflow-auto rounded-lg bg-gray-100 p-4 text-sm text-gray-800">
        {corpo ? (
          <pre className="whitespace-pre-wrap font-sans">{corpo}</pre>
        ) : (
          <span className="text-gray-500">Carregando conteúdo...</span>
        )}
      </div>
    </div>
  )
}

const PAGE_SIZE = 20
const SORT_COLUMNS: SortColumn[] = [
  { key: "status", label: "Status" },
  { key: "template", label: "Template" },
  { key: "enviadoEm", label: "Enviado em" },
]

const STATUS_OPTIONS: { value: StatusEntrega; label: string }[] = [
  { value: "sent", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "failed", label: "Falhou" },
]

const SUMMARY_CARDS = [
  { key: "totalEntregues", label: "Total entregues", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  { key: "taxaSucesso", label: "Taxa de sucesso", icon: Percent, color: "text-sky-600 bg-sky-50" },
  { key: "falhasCriticas", label: "Falhas críticas", icon: AlertCircle, color: "text-red-600 bg-red-50" },
] as const

export default function HistoricoEnviosPage() {
  const [search, setSearch] = useState("")
  const [templateTipo, setTemplateTipo] = useState<TemplateTipo | "">("")
  const [statusFilter, setStatusFilter] = useState<StatusEntrega | "">("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string>()
  const [dir, setDir] = useState<SortDir>()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search)

  const filters = useMemo(
    () => ({
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(templateTipo ? { templateTipo } : {}),
      ...(statusFilter ? { statusEntrega: statusFilter } : {}),
      ...(dataInicio ? { dataInicio } : {}),
      ...(dataFim ? { dataFim } : {}),
      page,
      pageSize: PAGE_SIZE,
      sort,
      dir,
    }),
    [debouncedSearch, templateTipo, statusFilter, dataInicio, dataFim, page, sort, dir],
  )

  const sortBy = (column: string) => {
    const next = nextSort(sort, dir, column)
    setSort(next.sort)
    setDir(next.dir)
    setPage(1)
  }

  const { data, isLoading, isPlaceholderData, isError, refetch } = useEmailLogs(filters)

  const logs = data?.data ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const templateTipoOptions = useMemo(
    () => [
      { value: "", label: "Todos os templates" },
      ...(Object.entries(TEMPLATE_TIPO_LABEL) as [TemplateTipo, string][]).map(
        ([value, label]) => ({ value, label }),
      ),
    ],
    [],
  )

  const statusOptions = useMemo(
    () => [
      { value: "", label: "Todos os status" },
      ...STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    ],
    [],
  )

  const pctFmt = new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 1,
  })

  const resumo = data?.resumo ?? { totalEntregues: 0, falhasCriticas: 0, total: 0 }
  const taxaSucesso = resumo.total > 0 ? resumo.totalEntregues / resumo.total : 0
  const cardValues = {
    totalEntregues: String(resumo.totalEntregues),
    taxaSucesso: pctFmt.format(taxaSucesso),
    falhasCriticas: String(resumo.falhasCriticas),
  }
  const listaCarregando = isLoading || isPlaceholderData
  const resumoCarregando = isLoading && !data

  const resetPage = () => setPage(1)

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Mail className="text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Erro ao carregar histórico</h3>
        <p className="mt-1 text-sm text-gray-500">Tente novamente em instantes.</p>
        <Button variant="outline" className="mt-6" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Histórico de Envios</h1>
        <p className="mt-1 text-sm text-gray-500">
          Acompanhe e-mails enviados aos moradores e o status de entrega.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
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
                      <p className="text-2xl font-bold text-foreground">{cardValues[card.key]}</p>
                    </div>
                  </div>
                </div>
              )
            })}
      </div>

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
            aria-label="Buscar morador ou e-mail"
            className="pl-10"
            placeholder="Buscar morador ou e-mail…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              resetPage()
            }}
          />
        </div>
        <Combobox
          options={templateTipoOptions}
          value={templateTipo}
          onValueChange={(v) => {
            setTemplateTipo(v as TemplateTipo | "")
            resetPage()
          }}
          placeholder="Tipo de template…"
          className="w-full min-w-0 md:w-52"
        />
        <Combobox
          options={statusOptions}
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as StatusEntrega | "")
            resetPage()
          }}
          placeholder="Buscar status…"
          className="w-full min-w-0 md:w-44"
        />
        <DatePicker
          aria-label="Data inicial"
          value={dataInicio}
          onValueChange={(value) => {
            setDataInicio(value)
            resetPage()
          }}
          className="w-full min-w-0 md:w-40"
        />
        <DatePicker
          aria-label="Data final"
          value={dataFim}
          onValueChange={(value) => {
            setDataFim(value)
            resetPage()
          }}
          className="w-full min-w-0 md:w-40"
        />
      </div>

      {!listaCarregando && logs.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Nenhum envio encontrado"
          description="Ajuste os filtros ou aguarde novos envios."
        />
      ) : (
        <div className="space-y-4">
          {listaCarregando ? (
            <ListSkeletonCards />
          ) : (
          <div className="space-y-3 md:hidden">
            {logs.map((log) => (
              <ListRecord
                key={log.id}
                title={log.morador.nome}
                fields={[
                  { label: "Status", value: <StatusEntregaBadge status={log.statusEntrega} /> },
                  { label: "Email", value: log.emailDestinatario },
                  {
                    label: "Template",
                    value: log.template ? (
                      <TemplateTipoBadge tipo={log.template.tipo as TemplateTipo} />
                    ) : (
                      "-"
                    ),
                  },
                  { label: "Assunto", value: log.assunto },
                  {
                    label: "Ocorrência",
                    value: log.ocorrencia ? (
                      <Link
                        to={`/ocorrencias/${log.ocorrencia.id}`}
                        className="font-medium text-emerald-700 underline-offset-2 hover:underline"
                      >
                        {log.ocorrencia.tipoOcorrencia}
                      </Link>
                    ) : (
                      "-"
                    ),
                  },
                  {
                    label: "Enviado em",
                    value: new Date(log.enviadoEm).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  },
                ]}
                primaryAction={
                  <ListRecordButton
                    icon={expandedId === log.id ? EyeOff : Eye}
                    aria-expanded={expandedId === log.id}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    {expandedId === log.id ? "Ocultar detalhes" : "Mostrar detalhes"}
                  </ListRecordButton>
                }
              >
                {expandedId === log.id ? <ExpandedLogRow logId={log.id} log={log} /> : null}
              </ListRecord>
            ))}
          </div>
          )}
          <ListPanel className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableHead label="Status" column="status" sort={sort} dir={dir} onSort={sortBy} className="w-[10%]" />
                  <TableHead className="w-[16%]">Destinatário</TableHead>
                  <SortableHead label="Template" column="template" sort={sort} dir={dir} onSort={sortBy} className="w-[14%]" />
                  <TableHead className="w-[22%]">Assunto</TableHead>
                  <TableHead className="w-[14%]">Ocorrência</TableHead>
                  <SortableHead label="Enviado em" column="enviadoEm" sort={sort} dir={dir} onSort={sortBy} className="w-[14%]" />
                  <TableHead className="w-[10%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCarregando ? (
                  <ListSkeletonRows columns={7} />
                ) : logs.map((log) => (
                  <Fragment key={log.id}>
                    <TableRow className="hover:bg-muted/60">
                      <TableCell>
                        <StatusEntregaBadge status={log.statusEntrega} />
                      </TableCell>
                      <TableCell>
                        <div className="truncate font-medium text-foreground">{log.morador.nome}</div>
                        <div className="truncate text-xs text-gray-500">{log.emailDestinatario}</div>
                      </TableCell>
                      <TableCell>
                        {log.template ? (
                          <TemplateTipoBadge tipo={log.template.tipo as TemplateTipo} />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="truncate text-gray-700">
                        {log.assunto}
                      </TableCell>
                      <TableCell>
                        {log.ocorrencia ? (
                          <Link
                            to={`/ocorrencias/${log.ocorrencia.id}`}
                            className="block truncate text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
                          >
                            {log.ocorrencia.tipoOcorrencia}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-gray-600">
                        {new Date(log.enviadoEm).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-expanded={expandedId === log.id}
                          aria-label={expandedId === log.id ? "Ocultar detalhes" : "Mostrar detalhes"}
                          onClick={() =>
                            setExpandedId(expandedId === log.id ? null : log.id)
                          }
                        >
                          {expandedId === log.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedId === log.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <ExpandedLogRow logId={log.id} log={log} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </ListPanel>
          {!listaCarregando && totalPages > 1 && (
            <ListPagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount > 0 ? totalCount : null}
              singular="registro"
              pluralLabel="registros"
              onPage={setPage}
            />
          )}
        </div>
      )}
    </div>
  )
}

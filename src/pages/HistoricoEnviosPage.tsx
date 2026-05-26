import { Fragment, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Mail,
  RefreshCw,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TemplateTipoBadge } from "@/features/comunicacao/components/TemplateTipoBadge"
import type { TemplateTipo } from "@/features/comunicacao/types/template.types"
import { StatusEntregaBadge } from "@/features/comunicacao/components/StatusEntregaBadge"
import { useEmailLogs, useEmailLog } from "@/features/comunicacao/hooks/useEmailLogs"
import { useTemplates } from "@/features/comunicacao/hooks/useTemplates"
import type { EmailLogFilters, StatusEntrega } from "@/features/comunicacao/types/email-log.types"

import type { EmailLog } from "@/features/comunicacao/types/email-log.types"

function ExpandedLogRow({ logId, log }: { logId: string; log: EmailLog }) {
  const { data: detail } = useEmailLog(logId)
  const corpo = detail?.corpoResolvido ?? log.corpoResolvido
  return (
    <TableRow>
      <TableCell colSpan={7} className="bg-gray-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Detalhes do envio
        </p>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Enviado por</dt>
            <dd className="font-medium text-gray-900">{log.enviadoPor.nome}</dd>
          </div>
          {log.template && (
            <div>
              <dt className="text-gray-500">Template</dt>
              <dd className="font-medium text-gray-900">{log.template.nome}</dd>
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
      </TableCell>
    </TableRow>
  )
}

const PAGE_SIZE = 20

const STATUS_OPTIONS: { value: StatusEntrega; label: string }[] = [
  { value: "sent", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "failed", label: "Falhou" },
]

export default function HistoricoEnviosPage() {
  const [draftSearch, setDraftSearch] = useState("")
  const [draftTemplateId, setDraftTemplateId] = useState("")
  const [draftStatus, setDraftStatus] = useState<StatusEntrega | "">("")
  const [draftDataInicio, setDraftDataInicio] = useState("")
  const [draftDataFim, setDraftDataFim] = useState("")

  const [appliedSearch, setAppliedSearch] = useState("")
  const [appliedTemplateId, setAppliedTemplateId] = useState("")
  const [appliedApi, setAppliedApi] = useState<EmailLogFilters>({
    page: 1,
    pageSize: PAGE_SIZE,
  })
  const [page, setPage] = useState(1)

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const apiFilters: EmailLogFilters = useMemo(
    () => ({
      ...appliedApi,
      page,
      pageSize: PAGE_SIZE,
    }),
    [appliedApi, page],
  )

  const { data, isLoading, isError, refetch } = useEmailLogs(apiFilters)
  const { data: templates } = useTemplates()

  const logsFromApi = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const totalCount = (data as { totalCount?: number } | undefined)?.totalCount

  const displayLogs = useMemo(() => {
    let list = logsFromApi
    if (appliedSearch.trim()) {
      const q = appliedSearch.trim().toLowerCase()
      list = list.filter(
        (l) =>
          l.morador.nome.toLowerCase().includes(q) ||
          l.emailDestinatario.toLowerCase().includes(q),
      )
    }
    if (appliedTemplateId) {
      list = list.filter((l) => l.template?.id === appliedTemplateId)
    }
    return list
  }, [logsFromApi, appliedSearch, appliedTemplateId])

  const totalPages =
    totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1

  const pctFmt = new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 1,
  })

  const totalEntregues = displayLogs.filter((l) => l.statusEntrega === "delivered").length
  const falhasCriticas = displayLogs.filter((l) => l.statusEntrega === "failed").length
  const taxaSucesso =
    displayLogs.length > 0 ? totalEntregues / displayLogs.length : 0

  const applyFilters = () => {
    setAppliedSearch(draftSearch)
    setAppliedTemplateId(draftTemplateId)
    setAppliedApi({
      statusEntrega: draftStatus || undefined,
      dataInicio: draftDataInicio || undefined,
      dataFim: draftDataFim || undefined,
      page: 1,
      pageSize: PAGE_SIZE,
    })
    setPage(1)
  }

  const templateList = Array.isArray(templates) ? templates : []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Mail className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Erro ao carregar histórico</h3>
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
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Histórico de Envios</h1>
        <p className="mt-1 text-sm text-gray-500">
          Acompanhe e-mails enviados aos moradores e o status de entrega.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-2 xl:col-span-2">
            <Label>Buscar (morador ou e-mail)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Nome ou e-mail..."
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <Select
              value={draftTemplateId || "__all__"}
              onValueChange={(v) => setDraftTemplateId(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os templates</SelectItem>
                {templateList.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={draftStatus || "__all__"}
              onValueChange={(v) =>
                setDraftStatus(v === "__all__" ? "" : (v as StatusEntrega))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="de">De</Label>
            <Input
              id="de"
              type="date"
              value={draftDataInicio}
              onChange={(e) => setDraftDataInicio(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ate">Até</Label>
            <Input
              id="ate"
              type="date"
              value={draftDataFim}
              onChange={(e) => setDraftDataFim(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Button
            type="button"
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={applyFilters}
          >
            Filtrar
          </Button>
        </div>
      </div>

      {displayLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <Mail className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Nenhum envio encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Ajuste os filtros ou aguarde novos envios.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Ocorrência</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayLogs.map((log) => (
                  <Fragment key={log.id}>
                    <TableRow className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium text-gray-900">{log.morador.nome}</div>
                        <div className="text-xs text-gray-500">{log.emailDestinatario}</div>
                      </TableCell>
                      <TableCell>
                        {log.template ? (
                          <TemplateTipoBadge tipo={log.template.tipo as TemplateTipo} />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-gray-700">
                        {log.assunto}
                      </TableCell>
                      <TableCell>
                        {log.ocorrencia ? (
                          <Link
                            to={`/ocorrencias/${log.ocorrencia.id}`}
                            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
                          >
                            {log.ocorrencia.tipoOcorrencia}
                          </Link>
                        ) : (
                          "—"
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
                      <TableCell>
                        <StatusEntregaBadge status={log.statusEntrega} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-expanded={expandedId === log.id}
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
                      <ExpandedLogRow logId={log.id} log={log} />
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages}
                {totalCount != null && ` · ${totalCount} registros`}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total entregues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-700">{totalEntregues}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Taxa de sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{pctFmt.format(taxaSucesso)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Falhas críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700">{falhasCriticas}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

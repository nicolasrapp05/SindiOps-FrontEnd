import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Plus, Search, AlertTriangle, RefreshCw, Eye,
  ChevronLeft, ChevronRight, Clock, CheckCircle2, Timer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import Combobox from "@/components/shared/Combobox"
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

export default function OcorrenciasPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<OcorrenciaStatus | "">("")
  const [tipoFilter, setTipoFilter] = useState<OcorrenciaTipo | "">("")
  const [origemFilter, setOrigemFilter] = useState<OcorrenciaOrigem | "">("")
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [page, setPage] = useState(1)

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
  }), [debouncedSearch, statusFilter, tipoFilter, origemFilter, page])

  const { data: ocorrenciasPage, isLoading, isFetching, isError, refetch } = useOcorrencias(condominioId, filters)
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

  const counts = useMemo(() => ({
    abertas: ocList.filter((o) => o.status === "nova" || o.status === "em_andamento").length,
    resolvidas: ocList.filter((o) => o.status === "finalizada").length,
  }), [ocList])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
        <h2 className="text-lg font-semibold text-gray-900">Erro ao carregar ocorrências</h2>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    )
  }

  const isEmpty = ocList.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ocorrências</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie e acompanhe as ocorrências registradas.</p>
        </div>
        <Button
          className="bg-emerald-700 hover:bg-emerald-800"
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
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
          className="w-full sm:w-44"
        />
        <Combobox
          options={[
            { value: "", label: "Todos os tipos" },
            ...Object.entries(TIPO_LABEL).map(([k, v]) => ({ value: k, label: v })),
          ]}
          value={tipoFilter || ""}
          onValueChange={(v) => { setTipoFilter(v as OcorrenciaTipo | ""); setPage(1) }}
          placeholder="Buscar…"
          className="w-full sm:w-44"
        />
        <Combobox
          options={[
            { value: "", label: "Todas as origens" },
            ...Object.entries(ORIGEM_LABEL).map(([k, v]) => ({ value: k, label: v })),
          ]}
          value={origemFilter || ""}
          onValueChange={(v) => { setOrigemFilter(v as OcorrenciaOrigem | ""); setPage(1) }}
          placeholder="Buscar…"
          className="w-full sm:w-44"
        />
      </div>

      {/* Table */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16">
          <AlertTriangle className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700">Nenhuma ocorrência encontrada</h3>
          <p className="mt-1 text-sm text-gray-400">Registre a primeira ocorrência do condomínio.</p>
          <Button className="mt-4 bg-emerald-700 hover:bg-emerald-800" onClick={() => setFormOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova Ocorrência
          </Button>
        </div>
      ) : (
        <div className={`rounded-xl bg-white shadow-sm transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="max-w-[200px]">Descrição</TableHead>
                  <TableHead className="w-32">Data</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ocList.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() => navigate(`/ocorrencias/${o.id}`)}
                  >
                    <TableCell><OcorrenciaStatusBadge status={o.status} /></TableCell>
                    <TableCell className="font-medium">{TIPO_LABEL[o.tipoOcorrencia]}</TableCell>
                    <TableCell>{ORIGEM_LABEL[o.origem]}</TableCell>
                    <TableCell>{TIPO_LOCAL_LABEL[o.tipoLocal]}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-gray-600">{o.descricao.slice(0, 150)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(o.ocorreuEm).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/ocorrencias/${o.id}`) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-gray-500">
              {totalCount} ocorrência{totalCount !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
          <div className="rounded-lg bg-amber-100 p-2"><Clock className="h-5 w-5 text-amber-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{counts.abertas}</p>
            <p className="text-xs text-gray-500">Em Aberto</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
          <div className="rounded-lg bg-emerald-100 p-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{counts.resolvidas}</p>
            <p className="text-xs text-gray-500">Resolvidas este mês</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
          <div className="rounded-lg bg-blue-100 p-2"><Timer className="h-5 w-5 text-blue-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-500">Tempo Médio Resposta</p>
          </div>
        </div>
      </div>

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

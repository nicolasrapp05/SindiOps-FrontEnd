import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Plus,
  Search,
  FileText,
  Pencil,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import Combobox from "@/components/shared/Combobox"
import {
  useContratos,
  useCreateContrato,
  useUpdateContrato,
  useUpdateContratoStatus,
} from "@/features/contratos/hooks/useContratos"
import type { Contrato, ContratoStatus, CreateContratoRequest } from "@/features/contratos/types/contrato.types"
import { TIPO_SERVICO_LABEL } from "@/features/contratos/types/contrato.types"
import ContratoForm from "@/features/contratos/components/ContratoForm"
import ContratoStatusBadge from "@/features/contratos/components/ContratoStatusBadge"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { useDebounce } from "@/hooks/useDebounce"

const PAGE_SIZE = 20

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function formatDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR")
}

function isFimWithinNext30Days(iso?: string): boolean {
  if (!iso) return false
  const end = new Date(`${iso}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const horizon = new Date(today)
  horizon.setDate(horizon.getDate() + 30)
  return end >= today && end <= horizon
}

const STATUS_FILTER_OPTIONS: { value: "all" | ContratoStatus; label: string }[] = [
  { value: "all", label: "Todos os status" },
  { value: "active", label: "Vigentes" },
  { value: "expiring", label: "Expirando" },
  { value: "expired", label: "Expirados" },
  { value: "cancelled", label: "Cancelados" },
]

const ROW_STATUS_OPTIONS: { value: ContratoStatus; label: string }[] = [
  { value: "active", label: "Vigente" },
  { value: "expiring", label: "Expirando" },
  { value: "expired", label: "Expirado" },
  { value: "cancelled", label: "Cancelado" },
]

export default function ContratosPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ContratoStatus>("all")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null)

  const condominioId = useCondominioScopeStore((s) => s.selectedCondominioId) ?? ""
  const condominioNome = useCondominioScopeStore((s) => s.selectedCondominioNome) ?? ""
  const condoConfigured = !!condominioId

  const debouncedSearch = useDebounce(search)

  const tableFilters = {
    search: debouncedSearch.trim() || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    pageSize: PAGE_SIZE,
  }

  const summaryFilters = { page: 1, pageSize: 2000 }

  const { data: contratosRaw, isLoading, isFetching, isError, refetch } = useContratos(condominioId, tableFilters)
  const { data: contratosSummaryRaw } = useContratos(condominioId, summaryFilters)

  const createMutation = useCreateContrato()
  const updateMutation = useUpdateContrato()
  const statusMutation = useUpdateContratoStatus()

  const contratoList = contratosRaw?.data ?? []
  const totalCount = contratosRaw?.totalCount
  const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 1

  const summaryList = contratosSummaryRaw?.data ?? []
  const statusCounts = useMemo(
    () => ({
      active: summaryList.filter((c) => c.status === "active").length,
      expiring: summaryList.filter((c) => c.status === "expiring").length,
      expired: summaryList.filter((c) => c.status === "expired").length,
      cancelled: summaryList.filter((c) => c.status === "cancelled").length,
    }),
    [summaryList],
  )

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <FileText className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Erro ao carregar contratos</h3>
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Contratos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Contratos de serviços do condomínio — fornecedores, vigência e valores.
          </p>
        </div>
        <Button
          className="bg-emerald-700 hover:bg-emerald-800"
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80">Vigentes</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{statusCounts.active}</p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-orange-800/80">Expirando</p>
          <p className="mt-1 text-2xl font-bold text-orange-800">{statusCounts.expiring}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-red-800/80">Expirados</p>
          <p className="mt-1 text-2xl font-bold text-red-800">{statusCounts.expired}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600">Cancelados</p>
          <p className="mt-1 text-2xl font-bold text-gray-700">{statusCounts.cancelled}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
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
          options={STATUS_FILTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v as "all" | ContratoStatus); setPage(1) }}
          placeholder="Buscar…"
          className="w-[200px]"
        />
      </div>

      {contratoList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Nenhum contrato encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Cadastre o primeiro contrato de serviço.</p>
          <Button className="mt-6 bg-emerald-700 hover:bg-emerald-800" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Novo Contrato
          </Button>
        </div>
      ) : (
        <div className={`rounded-xl bg-white shadow-sm transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Tipo de serviço</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Término</TableHead>
                  <TableHead>Valor mensal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[200px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratoList.map((c) => {
                  const warnRow = isFimWithinNext30Days(c.dataFim)
                  const contato =
                    [c.nomeContato, c.telefoneContato].filter(Boolean).join(" · ") || "—"
                  const statusBusy =
                    statusMutation.isPending && statusMutation.variables?.id === c.id
                  return (
                    <TableRow
                      key={c.id}
                      className={warnRow ? "bg-orange-50/50 hover:bg-orange-50/70" : undefined}
                    >
                      <TableCell className="font-medium text-gray-900">
                        {TIPO_SERVICO_LABEL[c.tipoServico]}
                      </TableCell>
                      <TableCell className="text-gray-700">{c.fornecedor.nome}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-gray-600">{contato}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(c.dataInicio)}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(c.dataFim)}</TableCell>
                      <TableCell className="text-gray-700">
                        {c.valorMensal != null ? formatBRL(c.valorMensal) : "—"}
                      </TableCell>
                      <TableCell>
                        <ContratoStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Select
                            value={c.status}
                            disabled={statusBusy}
                            onValueChange={(v) => {
                              statusMutation.mutate({ id: c.id, status: v as ContratoStatus })
                            }}
                          >
                            <SelectTrigger className="h-8 w-[130px]" size="sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROW_STATUS_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {totalCount != null && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-gray-500">
                {totalCount} contrato{totalCount !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
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

      <ContratoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        condominioId={condominioId}
        condominioNome={condominioNome}
        contrato={editingContrato}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}

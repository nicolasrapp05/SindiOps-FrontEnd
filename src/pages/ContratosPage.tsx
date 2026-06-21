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
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Ban,
  RotateCcw,
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
import Combobox from "@/components/shared/Combobox"
import ConfirmDialog from "@/components/shared/ConfirmDialog"
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

function formatDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR")
}

export default function ContratosPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ContratoStatus>("all")
  const [page, setPage] = useState(1)
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
  }

  const summaryFilters = { page: 1, pageSize: 2000 }

  const { data: contratosRaw, isLoading, isError, refetch } = useContratos(condominioId, tableFilters)
  const { data: contratosSummaryRaw } = useContratos(condominioId, summaryFilters)

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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.key} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts[card.key]}</p>
                </div>
              </div>
            </div>
          )
        })}
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
          options={CONTRATO_STATUS_FILTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
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
        <div className="rounded-xl bg-white shadow-sm">
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
                  const contato =
                    [c.nomeContato, c.telefoneContato].filter(Boolean).join(" · ") || "—"
                  const actionBusy =
                    (cancelMutation.isPending && cancelMutation.variables === c.id) ||
                    (reativarMutation.isPending && reativarMutation.variables === c.id)
                  const rowHighlight = contratoRowHighlightClass(c.status)
                  return (
                    <TableRow
                      key={c.id}
                      className={rowHighlight}
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
                          {podeCancelarContrato(c.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-gray-600"
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

import { Fragment, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Plus,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Search,
  ShoppingCart,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/useDebounce"
import { formatCargoLabel } from "@/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Combobox from "@/components/shared/Combobox"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useSolicitacoesCompra,
  useSolicitacaoCompra,
  useCreateSolicitacaoCompra,
  useAprovarSolicitacao,
  useUpdateStatusCompra,
} from "@/features/compras/hooks/useCompras"
import {
  COMPRA_CATEGORIA_LABEL,
  type CompraCategoria,
  type CompraStatus,
  type CreateSolicitacaoCompraRequest,
  type SolicitacaoCompra,
  type TipoAprovacao,
} from "@/features/compras/types/compra.types"
import CompraStatusBadge from "@/features/compras/components/CompraStatusBadge"
import SolicitacaoCompraForm from "@/features/compras/components/SolicitacaoCompraForm"
import MapaCotacoes from "@/features/compras/components/MapaCotacoes"
import AprovarCompraDialog from "@/features/compras/components/AprovarCompraDialog"
import {
  getAprovarBlockReason,
  getCotacaoReadinessLabel,
  isSindico,
} from "@/features/compras/lib/compra-flow"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/currency"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { useAuthStore } from "@/store/auth-store"

const TIPO_APROVACAO_LABEL: Record<TipoAprovacao, string> = {
  sindico: "Síndico",
  conselho: "Conselho",
  assembleia: "Assembleia",
}

type StatusTab = CompraStatus | "todas"

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "nova", label: "Nova" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada", label: "Cancelada" },
]

const CATEGORIAS: (CompraCategoria | "todas")[] = [
  "todas",
  "papelaria",
  "mat_construcao",
  "mat_limpeza",
  "mat_especifico",
]

const PAGE_SIZE = 10

interface AprovarDialogState {
  id: string
  tipoAprovacao: TipoAprovacao
  valorTotal?: number
}

function resolveTemCotacaoSelecionada(
  row: SolicitacaoCompra,
  detail?: SolicitacaoCompra,
): boolean {
  const source = detail ?? row
  return (
    source.temCotacaoSelecionada ??
    source.cotacoes?.some((c) => c.selecionada) ??
    false
  )
}

export default function ComprasPage() {
  const condominioId = useCondominioScopeStore((s) => s.selectedCondominioId) ?? ""
  const cargo = useAuthStore((s) => s.user?.cargo)
  const sindico = isSindico(cargo ?? "sindico")

  const [statusTab, setStatusTab] = useState<StatusTab>("todas")
  const [categoriaFilter, setCategoriaFilter] = useState<CompraCategoria | "todas">("todas")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [aprovarDialog, setAprovarDialog] = useState<AprovarDialogState | null>(null)

  const debouncedSearch = useDebounce(search)

  const apiFilters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: statusTab === "todas" ? undefined : statusTab,
      categoria: categoriaFilter === "todas" ? undefined : categoriaFilter,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedSearch, statusTab, categoriaFilter, page],
  )

  const { data, isLoading, isError, refetch } = useSolicitacoesCompra(
    condominioId,
    apiFilters,
  )
  const createMutation = useCreateSolicitacaoCompra()
  const aprovarMutation = useAprovarSolicitacao()
  const updateStatusMutation = useUpdateStatusCompra()

  const detailId = expandedId ?? ""
  const { data: expandedDetail, isLoading: detailLoading } = useSolicitacaoCompra(detailId)

  const list = data?.data ?? []
  const totalCount = data?.totalCount
  const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1

  const toggleExpand = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id))
  }

  const handleCreate = (payload: CreateSolicitacaoCompraRequest) => {
    createMutation.mutate(payload, { onSuccess: () => setFormOpen(false) })
  }

  const handleAprovarConfirm = () => {
    if (!aprovarDialog) return
    aprovarMutation.mutate(aprovarDialog.id, {
      onSuccess: () => setAprovarDialog(null),
    })
  }

  const condoConfigured = !!condominioId

  if (condoConfigured && isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-44" />
        </div>
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (condoConfigured && isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <ShoppingCart className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Erro ao carregar solicitações</h3>
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Solicitações de Compra
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe solicitações, cotações e aprovações.
          </p>
        </div>
        <Button
          className="shrink-0 bg-emerald-700 hover:bg-emerald-800"
          disabled={!condoConfigured}
          onClick={() => setFormOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nova Solicitação
        </Button>
      </div>

      {!condoConfigured && (
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
          Selecione um condomínio na barra lateral para carregar solicitações e habilitar novos
          cadastros. Cadastre condomínios em{" "}
          <Link
            to="/condominios"
            className="font-medium text-emerald-800 underline underline-offset-2"
          >
            Condomínios
          </Link>
          .
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <Button
              key={t.value}
              type="button"
              size="sm"
              variant={statusTab === t.value ? "default" : "outline"}
              onClick={() => {
                setStatusTab(t.value)
                setPage(1)
              }}
            >
              {t.label}
            </Button>
          ))}
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end xl:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar…"
              className="pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <Combobox
            options={CATEGORIAS.map((c) => ({
              value: c,
              label: c === "todas" ? "Todas as categorias" : COMPRA_CATEGORIA_LABEL[c],
            }))}
            value={categoriaFilter}
            onValueChange={(v) => { setCategoriaFilter(v as CompraCategoria | "todas"); setPage(1) }}
            placeholder="Buscar…"
            className="w-full sm:w-[220px]"
          />
        </div>
      </div>

      {!condoConfigured || list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            {!condoConfigured ? "Condomínio não configurado" : "Nenhuma solicitação"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {!condoConfigured
              ? "Informe o ID do condomínio para listar e criar solicitações."
              : "Crie a primeira solicitação de compra."}
          </p>
          <Button
            className="mt-6 bg-emerald-700 hover:bg-emerald-800"
            disabled={!condoConfigured}
            onClick={() => setFormOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Solicitação
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Status</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">QTD</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Tipo aprovação</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => {
                  const open = expandedId === row.id
                  const detail = open ? expandedDetail : undefined
                  const temCotacaoSelecionada = resolveTemCotacaoSelecionada(row, detail)
                  const readiness = getCotacaoReadinessLabel(
                    row.status,
                    row.totalCotacoes,
                    temCotacaoSelecionada,
                  )
                  const aprovarBlockReason = getAprovarBlockReason(
                    row.status,
                    row.totalCotacoes,
                    temCotacaoSelecionada,
                  )
                  const cotacoes = detail?.cotacoes ?? row.cotacoes ?? []
                  const cotacaoSelecionada = cotacoes.find((c) => c.selecionada)

                  return (
                    <Fragment key={row.id}>
                      <TableRow
                        className={cn("cursor-pointer", open && "bg-muted/40")}
                        data-state={open ? "open" : undefined}
                        onClick={() => toggleExpand(row.id)}
                      >
                        <TableCell className="align-middle">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-expanded={open}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpand(row.id)
                            }}
                          >
                            {open ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1.5">
                            <CompraStatusBadge status={row.status} />
                            {readiness && (
                              <span
                                className={cn(
                                  "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                  readiness.className,
                                )}
                              >
                                {readiness.label}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{COMPRA_CATEGORIA_LABEL[row.categoria]}</TableCell>
                        <TableCell className="max-w-[200px] truncate font-medium">{row.item}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.quantidade}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span>{row.solicitadoPor.nome}</span>
                            {row.solicitadoPor.cargo ? (
                              <span className="text-xs text-muted-foreground">
                                {formatCargoLabel(row.solicitadoPor.cargo)}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{TIPO_APROVACAO_LABEL[row.tipoAprovacao]}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {new Date(row.criadoEm).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                      {open && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={8} className="p-4">
                            {detailLoading ? (
                              <Skeleton className="h-40 w-full rounded-xl" />
                            ) : (
                              <>
                                <div className="mb-3 flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Mapa de cotações
                                  </p>
                                  <Link
                                    to="/compras/cotacoes"
                                    className="text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Gerenciar cotações →
                                  </Link>
                                </div>
                                <MapaCotacoes
                                  cotacoes={cotacoes}
                                />
                                {row.status !== "finalizada" && sindico && (
                                  <div className="mt-4 flex items-center justify-end gap-3 border-t pt-4">
                                    {row.status === "cancelada" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={updateStatusMutation.isPending}
                                        onClick={() =>
                                          updateStatusMutation.mutate({ id: row.id, status: "em_andamento" })
                                        }
                                      >
                                        Reativar Solicitação
                                      </Button>
                                    )}
                                    {(row.status === "nova" || row.status === "em_andamento") && (
                                      <Button
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                        size="sm"
                                        disabled={updateStatusMutation.isPending}
                                        onClick={() =>
                                          updateStatusMutation.mutate({ id: row.id, status: "cancelada" })
                                        }
                                      >
                                        Cancelar Solicitação
                                      </Button>
                                    )}
                                    {row.status === "nova" && (() => {
                                      const label = cotacaoSelecionada
                                        ? `Aprovar Compra (${formatBRL(cotacaoSelecionada.valorTotal)})`
                                        : "Aprovar Compra"
                                      const blocked = aprovarBlockReason !== null
                                      const btn = (
                                        <Button
                                          className="bg-emerald-700 hover:bg-emerald-800"
                                          size="sm"
                                          disabled={aprovarMutation.isPending || blocked}
                                          onClick={() =>
                                            setAprovarDialog({
                                              id: row.id,
                                              tipoAprovacao: row.tipoAprovacao,
                                              valorTotal: cotacaoSelecionada?.valorTotal,
                                            })
                                          }
                                        >
                                          {label}
                                        </Button>
                                      )
                                      if (!blocked) return btn
                                      return (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span tabIndex={0} className="inline-flex">
                                              {btn}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="max-w-[240px]">
                                            {aprovarBlockReason}
                                          </TooltipContent>
                                        </Tooltip>
                                      )
                                    })()}
                                    {row.status === "em_andamento" && (
                                      <Button
                                        className="bg-emerald-700 hover:bg-emerald-800"
                                        size="sm"
                                        disabled={updateStatusMutation.isPending}
                                        onClick={() =>
                                          updateStatusMutation.mutate({ id: row.id, status: "finalizada" })
                                        }
                                      >
                                        Finalizar Compra
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {totalCount != null ? `${totalCount} resultado${totalCount !== 1 ? "s" : ""} · ` : ""}
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <SolicitacaoCompraForm
        open={formOpen}
        onOpenChange={setFormOpen}
        condominioId={condominioId}
        isSubmitting={createMutation.isPending}
        onSubmit={handleCreate}
      />

      {aprovarDialog && (
        <AprovarCompraDialog
          open
          onOpenChange={(open) => { if (!open) setAprovarDialog(null) }}
          tipoAprovacao={aprovarDialog.tipoAprovacao}
          valorTotal={aprovarDialog.valorTotal}
          onConfirm={handleAprovarConfirm}
          isPending={aprovarMutation.isPending}
        />
      )}
    </div>
  )
}

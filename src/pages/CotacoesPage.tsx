import { Fragment, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Plus,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ReceiptText,
  Search,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/useDebounce"
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
import {
  useSolicitacoesCompra,
  useSolicitacaoCompra,
  useSelecionarCotacao,
  useCreateCotacao,
  useUpdateCotacao,
  useDeleteCotacao,
} from "@/features/compras/hooks/useCompras"
import {
  COMPRA_CATEGORIA_LABEL,
  type CompraCategoria,
  type CompraStatus,
  type CreateCotacaoRequest,
  type Cotacao,
} from "@/features/compras/types/compra.types"
import CompraStatusBadge from "@/features/compras/components/CompraStatusBadge"
import MapaCotacoes from "@/features/compras/components/MapaCotacoes"
import CotacaoForm from "@/features/compras/components/CotacaoForm"
import { cn } from "@/lib/utils"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"

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

interface CotacaoFormState {
  solicitacaoId: string
  cotacao?: Cotacao
}

export default function CotacoesPage() {
  const condominioId = useCondominioScopeStore((s) => s.selectedCondominioId) ?? ""

  const [statusTab, setStatusTab] = useState<StatusTab>("todas")
  const [categoriaFilter, setCategoriaFilter] = useState<CompraCategoria | "todas">("todas")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cotacaoFormState, setCotacaoFormState] = useState<CotacaoFormState | null>(null)

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

  const { data, isLoading, isFetching, isError, refetch } = useSolicitacoesCompra(
    condominioId,
    apiFilters,
  )

  const detailId = expandedId ?? ""
  const { data: expandedDetail, isLoading: detailLoading } = useSolicitacaoCompra(detailId)

  const selecionarMutation = useSelecionarCotacao()
  const createCotacaoMutation = useCreateCotacao()
  const updateCotacaoMutation = useUpdateCotacao()
  const deleteCotacaoMutation = useDeleteCotacao()

  const list = data?.data ?? []
  const totalCount = data?.totalCount
  const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1

  const toggleExpand = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id))
  }

  const openCreateForm = (solicitacaoId: string) => {
    setCotacaoFormState({ solicitacaoId })
  }

  const openEditForm = (solicitacaoId: string, cotacao: Cotacao) => {
    setCotacaoFormState({ solicitacaoId, cotacao })
  }

  const closeForm = () => {
    setCotacaoFormState(null)
  }

  const handleFormSubmit = (data: CreateCotacaoRequest) => {
    if (!cotacaoFormState) return

    const { solicitacaoId, cotacao } = cotacaoFormState

    if (cotacao) {
      updateCotacaoMutation.mutate(
        { solicitacaoId, cotacaoId: cotacao.id, data },
        { onSuccess: closeForm },
      )
    } else {
      createCotacaoMutation.mutate(
        { solicitacaoId, data },
        { onSuccess: closeForm },
      )
    }
  }

  const condoConfigured = !!condominioId

  const isFormSubmitting =
    createCotacaoMutation.isPending || updateCotacaoMutation.isPending

  if (condoConfigured && isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-64" />
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
          <ReceiptText className="h-8 w-8 text-red-500" />
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cotações</h1>
        <p className="mt-1 text-sm text-gray-500">
          Adicione, compare e selecione cotações para as solicitações de compra.
        </p>
      </div>

      {!condoConfigured && (
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
          Selecione um condomínio na barra lateral para carregar as solicitações. Cadastre
          condomínios em{" "}
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
          <Select
            value={categoriaFilter}
            onValueChange={(v) => {
              setCategoriaFilter(v as CompraCategoria | "todas")
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "todas" ? "Todas as categorias" : COMPRA_CATEGORIA_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!condoConfigured || list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <ReceiptText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            {!condoConfigured ? "Condomínio não configurado" : "Nenhuma solicitação encontrada"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {!condoConfigured
              ? "Selecione um condomínio na barra lateral para visualizar solicitações."
              : "Não há solicitações com os filtros aplicados."}
          </p>
          {condoConfigured && (
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setStatusTab("todas")
                setCategoriaFilter("todas")
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`overflow-hidden rounded-xl bg-white shadow-sm transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Status</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">QTD</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead className="text-right">Cotações</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => {
                  const open = expandedId === row.id
                  const cotacoes = open
                    ? (expandedDetail?.cotacoes ?? row.cotacoes ?? [])
                    : (row.cotacoes ?? [])
                  const cotacoesCount = cotacoes.length

                  return (
                    <Fragment key={row.id}>
                      <TableRow
                        className={cn("cursor-pointer", open && "bg-muted/40")}
                        onClick={() => toggleExpand(row.id)}
                        data-state={open ? "open" : undefined}
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
                          <CompraStatusBadge status={row.status} />
                        </TableCell>
                        <TableCell>{COMPRA_CATEGORIA_LABEL[row.categoria]}</TableCell>
                        <TableCell className="max-w-[200px] truncate font-medium">
                          {row.item}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.quantidade}</TableCell>
                        <TableCell>{row.solicitadoPor.nome}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
                              cotacoesCount === 0
                                ? "bg-gray-100 text-gray-500"
                                : "bg-emerald-100 text-emerald-700",
                            )}
                          >
                            {cotacoesCount}
                          </span>
                        </TableCell>
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
                              <div className="space-y-4">
                                <MapaCotacoes
                                  cotacoes={expandedDetail?.cotacoes ?? row.cotacoes ?? []}
                                  isSelecting={selecionarMutation.isPending}
                                  onSelecionar={(cotacaoId) =>
                                    selecionarMutation.mutate({
                                      solicitacaoId: row.id,
                                      cotacaoId,
                                    })
                                  }
                                  onEdit={(cotacao) => openEditForm(row.id, cotacao)}
                                  onDelete={(cotacaoId) =>
                                    deleteCotacaoMutation.mutate({
                                      solicitacaoId: row.id,
                                      cotacaoId,
                                    })
                                  }
                                  isDeleting={deleteCotacaoMutation.isPending}
                                />
                                <div className="flex items-center justify-end border-t pt-4">
                                  <Button
                                    className="bg-emerald-700 hover:bg-emerald-800"
                                    size="sm"
                                    onClick={() => openCreateForm(row.id)}
                                  >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Adicionar cotação
                                  </Button>
                                </div>
                              </div>
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
              {isFetching ? " · Atualizando…" : ""}
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

      <CotacaoForm
        open={cotacaoFormState !== null}
        onOpenChange={(open) => { if (!open) closeForm() }}
        cotacao={cotacaoFormState?.cotacao}
        isSubmitting={isFormSubmitting}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}

import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Eye, Plus, RefreshCw, Search, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import EmptyState from "@/components/shared/EmptyState"
import ListPagination from "@/components/shared/ListPagination"
import ListPanel from "@/components/shared/ListPanel"
import ListRecord from "@/components/shared/ListRecord"
import ListRecordButton from "@/components/shared/ListRecordButton"
import { ListSkeletonCards, ListSkeletonRows } from "@/components/shared/ListSkeleton"
import ListSortMenu from "@/components/shared/ListSortMenu"
import SortableHead from "@/components/shared/SortableHead"
import { nextSort, type SortColumn } from "@/lib/list-sort"
import { useCreateSolicitacaoCompra, useSolicitacoesCompra } from "@/features/compras/hooks/useCompras"
import {
  COMPRA_CATEGORIA_LABEL,
  SITUACAO_COTACAO_LABEL,
  type CompraCategoria,
  type CompraStatus,
  type CreateSolicitacaoCompraRequest,
  type SituacaoCotacao,
  type TipoAprovacao,
} from "@/features/compras/types/compra.types"
import CompraStatusBadge from "@/features/compras/components/CompraStatusBadge"
import SolicitacaoCompraForm from "@/features/compras/components/SolicitacaoCompraForm"
import { getCotacaoReadinessLabel, resumoItensCompra } from "@/features/compras/lib/compra-flow"
import {
  compraDetalheTo,
  readCompraListParams,
  writeCompraListParams,
  type CompraListParams,
} from "@/features/compras/lib/compra-list-params"
import { cn } from "@/lib/utils"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"

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

const SITUACOES_COTACAO = Object.keys(SITUACAO_COTACAO_LABEL) as SituacaoCotacao[]
const COMPRA_SORT_COLUMNS: SortColumn[] = [
  { key: "status", label: "Status" },
  { key: "itens", label: "Itens" },
  { key: "solicitante", label: "Solicitante" },
  { key: "tipoAprovacao", label: "Tipo aprovação" },
  { key: "cotacoes", label: "Cotações" },
  { key: "data", label: "Data" },
]

export default function ComprasPage() {
  const condominioId = useCondominioScopeStore((s) => s.selectedCondominioId) ?? ""
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.toString()
  const filters = useMemo(() => readCompraListParams(new URLSearchParams(query)), [query])
  const canonicalQuery = useMemo(() => writeCompraListParams(filters).toString(), [filters])

  const [formOpen, setFormOpen] = useState(false)
  const debouncedSearch = useDebounce(filters.search)

  useEffect(() => {
    if (canonicalQuery !== query) {
      setSearchParams(canonicalQuery, { replace: true })
    }
  }, [canonicalQuery, query, setSearchParams])

  const updateList = (patch: Partial<CompraListParams>) => {
    const current = readCompraListParams(new URLSearchParams(query))
    setSearchParams(writeCompraListParams({ ...current, ...patch }), { replace: true })
  }

  const sortBy = (column: string) => {
    const next = nextSort(filters.sort, filters.dir, column)
    updateList({ sort: next.sort, dir: next.dir, page: 1 })
  }

  const apiFilters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: filters.situacaoCotacao ? "nova" : filters.status === "todas" ? undefined : filters.status,
      categoria: filters.categoria === "todas" ? undefined : filters.categoria,
      situacaoCotacao: filters.situacaoCotacao || undefined,
      page: filters.page,
      pageSize: PAGE_SIZE,
      sort: filters.sort,
      dir: filters.dir,
    }),
    [debouncedSearch, filters],
  )

  const filtrosAtivos =
    filters.status !== "todas" ||
    filters.categoria !== "todas" ||
    !!filters.situacaoCotacao ||
    !!filters.search.trim()

  const { data, isLoading, isPlaceholderData, isError, refetch } = useSolicitacoesCompra(condominioId, apiFilters)
  const createMutation = useCreateSolicitacaoCompra()

  const list = data?.data ?? []
  const totalCount = data?.totalCount
  const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1
  const detalheTo = (id: string) => compraDetalheTo(id, new URLSearchParams(query))

  const handleCreate = (payload: CreateSolicitacaoCompraRequest) => {
    createMutation.mutate(payload, { onSuccess: () => setFormOpen(false) })
  }

  const condoConfigured = !!condominioId
  const listaCarregando = condoConfigured && (isLoading || isPlaceholderData)

  if (condoConfigured && isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <ShoppingCart className="text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Erro ao carregar solicitações</h3>
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Solicitações de Compra
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe solicitações, cotações e aprovações.
          </p>
        </div>
        <Button
          className="shrink-0"
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
              variant={filters.status === t.value ? "default" : "outline"}
              className="min-h-11"
              onClick={() =>
                updateList({
                  status: t.value,
                  situacaoCotacao: t.value === "nova" ? filters.situacaoCotacao : "",
                  page: 1,
                })
              }
            >
              {t.label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 xl:flex xl:w-auto xl:items-center xl:justify-end xl:gap-2">
          <ListSortMenu
            columns={COMPRA_SORT_COLUMNS}
            sort={filters.sort}
            dir={filters.dir}
            onChange={(sort, dir) => updateList({ sort, dir, page: 1 })}
            className="w-full min-w-0 md:hidden"
          />
          <div className="relative w-full min-w-0 xl:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Buscar…"
              aria-label="Buscar por item ou justificativa"
              className="pl-10"
              value={filters.search}
              onChange={(e) => updateList({ search: e.target.value, page: 1 })}
            />
          </div>
          <Combobox
            options={CATEGORIAS.map((c) => ({
              value: c,
              label: c === "todas" ? "Todas as categorias" : COMPRA_CATEGORIA_LABEL[c],
            }))}
            value={filters.categoria}
            onValueChange={(v) => updateList({ categoria: v as CompraCategoria | "todas", page: 1 })}
            placeholder="Buscar…"
            className="w-full min-w-0 xl:w-[220px]"
          />
          <Combobox
            options={[
              { value: "", label: "Todas as cotações" },
              ...SITUACOES_COTACAO.map((situacao) => ({
                value: situacao,
                label: SITUACAO_COTACAO_LABEL[situacao],
              })),
            ]}
            value={filters.situacaoCotacao}
            onValueChange={(value) => {
              const situacao = value as SituacaoCotacao | ""
              updateList({
                situacaoCotacao: situacao,
                status: situacao ? "nova" : filters.status,
                page: 1,
              })
            }}
            placeholder="Cotações"
            className="w-full min-w-0 xl:w-[220px]"
          />
        </div>
      </div>

      {!condoConfigured || (!listaCarregando && list.length === 0) ? (
        <EmptyState
          icon={ShoppingCart}
          title={
            !condoConfigured
              ? "Condomínio não configurado"
              : filtrosAtivos
                ? "Nenhuma solicitação encontrada"
                : "Nenhuma solicitação"
          }
          description={
            !condoConfigured
              ? "Informe o ID do condomínio para listar e criar solicitações."
              : filtrosAtivos
                ? "Não há solicitações com os filtros aplicados."
                : "Crie a primeira solicitação de compra."
          }
          action={
            condoConfigured && filtrosAtivos ? (
              <Button
                variant="outline"
                onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
              >
                Limpar filtros
              </Button>
            ) : (
              <Button disabled={!condoConfigured} onClick={() => setFormOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Nova Solicitação
              </Button>
            )
          }
        />
      ) : (
        <>
          {listaCarregando ? (
            <ListSkeletonCards />
          ) : (
          <div className="space-y-3 md:hidden">
            {list.map((row) => {
              const readiness = getCotacaoReadinessLabel(
                row.status,
                row.totalCotacoes,
                row.temCotacaoSelecionada ?? false,
              )
              const itensResumo = resumoItensCompra(row.itens)
              return (
                <ListRecord
                  key={row.id}
                  title={itensResumo.descricao}
                  onClick={() => navigate(detalheTo(row.id))}
                  fields={[
                    { label: "Status", value: <CompraStatusBadge status={row.status} /> },
                    { label: "Categoria", value: itensResumo.categoria },
                    { label: "Itens", value: itensResumo.quantidade },
                    { label: "Solicitante", value: row.solicitadoPor.nome },
                    { label: "Tipo aprovação", value: TIPO_APROVACAO_LABEL[row.tipoAprovacao] },
                    {
                      label: "Cotações",
                      value: readiness ? readiness.label : row.totalCotacoes,
                    },
                    {
                      label: "Data",
                      value: new Date(row.criadoEm).toLocaleDateString("pt-BR"),
                    },
                  ]}
                  primaryAction={
                    <ListRecordButton icon={Eye} onClick={() => navigate(detalheTo(row.id))}>
                      Abrir
                    </ListRecordButton>
                  }
                />
              )
            })}
          </div>
          )}
          <ListPanel className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <SortableHead label="Status" column="status" sort={filters.sort} dir={filters.dir} onSort={sortBy} className="w-[13%]" />
                  <TableHead className="w-[12%]">Categoria</TableHead>
                  <TableHead className="w-[14%]">Item</TableHead>
                  <SortableHead label="Itens" column="itens" sort={filters.sort} dir={filters.dir} onSort={sortBy} align="right" className="w-[8%] text-right" />
                  <SortableHead label="Solicitante" column="solicitante" sort={filters.sort} dir={filters.dir} onSort={sortBy} className="w-[13%]" />
                  <SortableHead label="Tipo aprovação" column="tipoAprovacao" sort={filters.sort} dir={filters.dir} onSort={sortBy} className="w-[14%]" />
                  <SortableHead label="Cotações" column="cotacoes" sort={filters.sort} dir={filters.dir} onSort={sortBy} className="w-[8%]" />
                  <SortableHead label="Data" column="data" sort={filters.sort} dir={filters.dir} onSort={sortBy} className="w-[10%]" />
                  <TableHead className="w-[8%]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCarregando ? (
                  <ListSkeletonRows columns={9} />
                ) : list.map((row) => {
                  const readiness = getCotacaoReadinessLabel(
                    row.status,
                    row.totalCotacoes,
                    row.temCotacaoSelecionada ?? false,
                  )
                  const itensResumo = resumoItensCompra(row.itens)

                  return (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => navigate(detalheTo(row.id))}
                    >
                      <TableCell>
                        <CompraStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell title={itensResumo.categoriasTitulo}>
                        {itensResumo.categoria}
                      </TableCell>
                      <TableCell className="overflow-hidden font-medium" title={itensResumo.titulo}>
                        <div className="flex min-w-0 items-center gap-2">
                          <Link
                            to={detalheTo(row.id)}
                            className="truncate underline-offset-2 hover:underline"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {itensResumo.descricao}
                          </Link>
                          {itensResumo.extras > 0 && (
                            <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                              +{itensResumo.extras}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {itensResumo.quantidade}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="truncate">{row.solicitadoPor.nome}</span>
                          {row.solicitadoPor.cargo ? (
                            <span className="text-xs text-muted-foreground">
                              {formatCargoLabel(row.solicitadoPor.cargo)}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{TIPO_APROVACAO_LABEL[row.tipoAprovacao]}</TableCell>
                      <TableCell>
                        {readiness ? (
                          <span
                            className={cn(
                              "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              readiness.className,
                            )}
                          >
                            {readiness.label}
                          </span>
                        ) : (
                          <span className="text-sm tabular-nums text-muted-foreground">
                            {row.totalCotacoes}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(row.criadoEm).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Abrir solicitação"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(detalheTo(row.id))
                          }}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ListPanel>
          {!listaCarregando && (
          <ListPagination
            page={filters.page}
            totalPages={totalPages}
            totalCount={totalCount}
            singular="resultado"
            pluralLabel="resultados"
            onPage={(page) => updateList({ page })}
          />
          )}
        </>
      )}
      <SolicitacaoCompraForm
        open={formOpen}
        onOpenChange={setFormOpen}
        condominioId={condominioId}
        isSubmitting={createMutation.isPending}
        onSubmit={handleCreate}
      />
    </div>
  )
}

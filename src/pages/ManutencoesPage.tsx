import { useEffect, useMemo, useState } from "react"
import { Eye, Hammer, Plus, RefreshCw, Search } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import EmptyState from "@/components/shared/EmptyState"
import ListPagination from "@/components/shared/ListPagination"
import ListPanel from "@/components/shared/ListPanel"
import ListRecord from "@/components/shared/ListRecord"
import { ListSkeletonCards, ListSkeletonRows } from "@/components/shared/ListSkeleton"
import ListSortMenu from "@/components/shared/ListSortMenu"
import SortableHead from "@/components/shared/SortableHead"
import { nextSort, type SortColumn } from "@/lib/list-sort"
import { useDebounce } from "@/hooks/useDebounce"
import { canAccessAdmin } from "@/lib/cargo-permissions"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { SolicitacaoStatusBadge } from "@/features/manutencoes/components/SolicitacaoStatusBadge"
import { SituacaoOrcamentoBadge } from "@/features/manutencoes/components/SituacaoOrcamentoBadge"
import SolicitacaoManutencaoForm from "@/features/manutencoes/components/SolicitacaoManutencaoForm"
import {
  useSolicitacoesManutencao,
  useCreateSolicitacaoManutencao,
} from "@/features/manutencoes/hooks/useSolicitacoesManutencao"
import {
  FILTROS_FILA,
  manutencaoDetalheTo,
  readManutencaoListParams,
  writeManutencaoListParams,
  type FiltroFila,
  type ManutencaoListParams,
} from "@/features/manutencoes/lib/manutencao-list-params"
import {
  SOLICITACAO_TIPO_LABEL,
  SITUACAO_ORCAMENTO_LABEL,
  type CreateSolicitacaoManutencaoRequest,
  type SituacaoOrcamento,
  type SolicitacaoStatus,
  type SolicitacaoTipoServico,
} from "@/features/manutencoes/types/solicitacao-manutencao.types"

const PAGE_SIZE = 10
const FILA_SORT_COLUMNS: SortColumn[] = [
  { key: "situacao", label: "Situação" },
  { key: "tipo", label: "Chamado" },
  { key: "local", label: "Local" },
  { key: "propostas", label: "Propostas" },
  { key: "status", label: "Status" },
]
const CHAMADO_SORT_COLUMNS: SortColumn[] = [
  { key: "status", label: "Status" },
  { key: "tipo", label: "Tipo de serviço" },
  { key: "orcamento", label: "Orçamento" },
  { key: "local", label: "Local" },
  { key: "responsavel", label: "Responsável" },
  { key: "fornecedor", label: "Fornecedor" },
  { key: "dataConclusao", label: "Data conclusão" },
]

const TIPOS = Object.keys(SOLICITACAO_TIPO_LABEL) as SolicitacaoTipoServico[]

const STATUS_TABS: (SolicitacaoStatus | "todas")[] = [
  "todas",
  "nova",
  "em_andamento",
  "finalizada",
  "cancelada",
]

const STATUS_TAB_LABEL: Record<SolicitacaoStatus | "todas", string> = {
  todas: "Todas",
  nova: "Nova",
  em_andamento: "Em andamento",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
}

const FILTRO_FILA_LABEL: Record<FiltroFila, string> = {
  pendentes: "Pendentes",
  ...SITUACAO_ORCAMENTO_LABEL,
  todas: "Todas",
}


export default function ManutencoesPage() {
  const condominioId = useCondominioScopeStore((s) => s.selectedCondominioId) ?? ""
  const cargo = useAuthStore((s) => s.user?.cargo)
  const admin = canAccessAdmin(cargo)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.toString()
  const parsed = useMemo(() => readManutencaoListParams(new URLSearchParams(query)), [query])
  const visaoOrcamentos = admin && parsed.visao === "orcamentos"
  const sortColumns = visaoOrcamentos ? FILA_SORT_COLUMNS : CHAMADO_SORT_COLUMNS
  const parsedLimpo = useMemo<ManutencaoListParams>(
    () =>
      sortColumns.some((column) => column.key === parsed.sort)
        ? parsed
        : { ...parsed, sort: undefined, dir: undefined },
    [parsed, sortColumns],
  )
  const viewState = useMemo<ManutencaoListParams>(
    () => (visaoOrcamentos ? parsedLimpo : { ...parsedLimpo, visao: "chamados" }),
    [parsedLimpo, visaoOrcamentos],
  )
  const canonicalQuery = useMemo(() => writeManutencaoListParams(parsedLimpo).toString(), [parsedLimpo])
  const [formOpen, setFormOpen] = useState(false)
  const debouncedSearch = useDebounce(viewState.search)

  useEffect(() => {
    if (canonicalQuery !== query) {
      setSearchParams(canonicalQuery, { replace: true })
    }
  }, [canonicalQuery, query, setSearchParams])

  const updateList = (patch: Partial<ManutencaoListParams>) => {
    const current = readManutencaoListParams(new URLSearchParams(query))
    const base: ManutencaoListParams =
      admin && current.visao === "orcamentos" ? current : { ...current, visao: "chamados" }
    setSearchParams(writeManutencaoListParams({ ...base, ...patch }), { replace: true })
  }

  const sortAtivo = sortColumns.some((column) => column.key === viewState.sort)
    ? { sort: viewState.sort, dir: viewState.dir }
    : undefined

  const sortBy = (column: string) => {
    const next = nextSort(sortAtivo?.sort, sortAtivo?.dir, column)
    updateList({ sort: next.sort, dir: next.dir, page: 1 })
  }

  const filters = useMemo(() => {
    if (visaoOrcamentos) {
      return {
        search: debouncedSearch.trim() || undefined,
        situacaoOrcamento:
          viewState.fila !== "pendentes" && viewState.fila !== "todas"
            ? (viewState.fila as SituacaoOrcamento)
            : undefined,
        pendenteOrcamento: viewState.fila === "pendentes" ? true : undefined,
        page: viewState.page,
        pageSize: PAGE_SIZE,
        sort: sortAtivo?.sort,
        dir: sortAtivo?.dir,
      }
    }

    return {
      search: debouncedSearch.trim() || undefined,
      status: viewState.status === "todas" ? undefined : viewState.status,
      tipoServico: viewState.tipoServico || undefined,
      situacaoOrcamento: viewState.situacaoOrcamento || undefined,
      page: viewState.page,
      pageSize: PAGE_SIZE,
      sort: sortAtivo?.sort,
      dir: sortAtivo?.dir,
    }
  }, [debouncedSearch, viewState, visaoOrcamentos, sortAtivo])

  const setVisao = (fila: boolean) => {
    const current = readManutencaoListParams(new URLSearchParams(query))
    setSearchParams(
      writeManutencaoListParams({
        ...current,
        visao: fila ? "orcamentos" : "chamados",
        sort: undefined,
        dir: undefined,
        page: 1,
      }),
      { replace: true },
    )
  }

  const detalheTo = (id: string) => manutencaoDetalheTo(id, viewState)

  const { data, isLoading, isError, isPlaceholderData, refetch } = useSolicitacoesManutencao(
    condominioId,
    filters,
  )

  const createMutation = useCreateSolicitacaoManutencao()

  const list = data?.data ?? []
  const totalCount = data?.totalCount
  const totalPages =
    totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1

  const handleCreate = (payload: CreateSolicitacaoManutencaoRequest) => {
    createMutation.mutate(payload, { onSuccess: () => setFormOpen(false) })
  }

  const condoConfigured = !!condominioId
  const listaCarregando = condoConfigured && (isLoading || isPlaceholderData)
  const visaoPainel = visaoOrcamentos ? "orcamentos" : "chamados"

  useEffect(() => {
    document.getElementById("conteudo")?.scrollTo({ top: 0 })
  }, [visaoPainel])

  if (condoConfigured && isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Hammer className="text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          {visaoOrcamentos ? "Erro ao carregar orçamentos" : "Erro ao carregar solicitações"}
        </h3>
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
            Solicitações de Manutenção
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {visaoOrcamentos
              ? "Chamados que ainda pedem uma proposta, uma escolha ou a aprovação do síndico."
              : "Acompanhe e gerencie os chamados de manutenção."}
          </p>
          {admin && (
            <div
              className="mt-4 flex w-full border-b border-border lg:w-fit"
              role="tablist"
              aria-label="Visão da lista"
            >
              {(
                [
                  { fila: false, label: "Chamados" },
                  { fila: true, label: "Fila de orçamento" },
                ] as const
              ).map((item) => {
                const selected = visaoOrcamentos === item.fila
                return (
                  <button
                    key={item.label}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={cn(
                      "-mb-px min-h-11 flex-1 cursor-pointer border-b-2 px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none lg:flex-none",
                      selected
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setVisao(item.fila)}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          )}
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

      <div
        key={visaoPainel}
        className="rise-in space-y-6"
      >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {visaoOrcamentos
            ? FILTROS_FILA.map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  className="min-h-11"
                  variant={parsed.fila === item ? "default" : "outline"}
                  onClick={() => updateList({ fila: item, page: 1 })}
                >
                  {FILTRO_FILA_LABEL[item]}
                </Button>
              ))
            : STATUS_TABS.map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  size="sm"
                  className="min-h-11"
                  variant={viewState.status === tab ? "default" : "outline"}
                  onClick={() => updateList({ status: tab, page: 1 })}
                >
                  {STATUS_TAB_LABEL[tab]}
                </Button>
              ))}
        </div>
        <div className="grid grid-cols-2 gap-3 xl:flex xl:w-auto xl:items-center xl:justify-end xl:gap-2">
          <ListSortMenu
            columns={sortColumns}
            sort={sortAtivo?.sort}
            dir={sortAtivo?.dir}
            onChange={(sort, dir) => updateList({ sort, dir, page: 1 })}
            className="w-full min-w-0 md:hidden"
          />
          <div className="relative w-full min-w-0 xl:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              autoComplete="off"
              spellCheck={false}
              aria-label={visaoOrcamentos ? "Buscar chamados" : "Buscar manutenções"}
              placeholder="Buscar…"
              className="pl-10"
              value={viewState.search}
              onChange={(e) => updateList({ search: e.target.value, page: 1 })}
            />
          </div>
          {!visaoOrcamentos && (
            <>
              <Combobox
                options={[
                  { value: "", label: "Todos os tipos" },
                  ...TIPOS.map((t) => ({ value: t, label: SOLICITACAO_TIPO_LABEL[t] })),
                ]}
                value={viewState.tipoServico || ""}
                onValueChange={(v) => updateList({ tipoServico: v as SolicitacaoTipoServico | "", page: 1 })}
                placeholder="Buscar…"
                className="w-full min-w-0 xl:w-[220px]"
              />
              <Combobox
                options={[
                  { value: "", label: "Todos os orçamentos" },
                  ...(Object.keys(SITUACAO_ORCAMENTO_LABEL) as SituacaoOrcamento[]).map((situacao) => ({
                    value: situacao,
                    label: SITUACAO_ORCAMENTO_LABEL[situacao],
                  })),
                ]}
                value={viewState.situacaoOrcamento || ""}
                onValueChange={(v) => updateList({ situacaoOrcamento: v as SituacaoOrcamento | "", page: 1 })}
                placeholder="Orçamento"
                className="w-full min-w-0 xl:w-[220px]"
              />
            </>
          )}
        </div>
      </div>

      {!condoConfigured || (!listaCarregando && list.length === 0) ? (
        <EmptyState
          icon={Hammer}
          title={
            !condoConfigured
              ? "Condomínio não configurado"
              : visaoOrcamentos
                ? "Nenhum chamado nesta fila"
                : "Nenhuma solicitação"
          }
          description={
            !condoConfigured
              ? "Informe o ID do condomínio para listar e criar solicitações."
              : visaoOrcamentos
                ? "Abra um chamado para registrar propostas."
                : "Abra um novo chamado de manutenção."
          }
          action={
            visaoOrcamentos && condoConfigured ? (
              <Button variant="outline" onClick={() => setVisao(false)}>
                Ver chamados
              </Button>
            ) : (
              <Button disabled={!condoConfigured} onClick={() => setFormOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Nova Solicitação
              </Button>
            )
          }
        />
      ) : visaoOrcamentos ? (
        <div className="space-y-4">
          {listaCarregando ? (
            <ListSkeletonCards />
          ) : (
            <div className="space-y-3 md:hidden">
              {list.map((row) => (
                <ListRecord
                  key={row.id}
                  title={SOLICITACAO_TIPO_LABEL[row.tipoServico]}
                  onClick={() => navigate(detalheTo(row.id))}
                  fields={[
                    { label: "Situação", value: <SituacaoOrcamentoBadge situacao={row.situacaoOrcamento} /> },
                    { label: "Local", value: row.local },
                    { label: "Propostas", value: row.totalOrcamentos ?? 0 },
                    { label: "Status", value: <SolicitacaoStatusBadge status={row.status} /> },
                  ]}
                  actions={
                    <Button
                      variant="outline"
                      className="min-h-11"
                      onClick={() => navigate(detalheTo(row.id))}
                    >
                      Abrir
                    </Button>
                  }
                />
              ))}
            </div>
          )}
          <ListPanel className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <SortableHead label="Situação" column="situacao" sort={sortAtivo?.sort} dir={sortAtivo?.dir} onSort={sortBy} className="w-[16%]" />
                  <SortableHead label="Chamado" column="tipo" sort={sortAtivo?.sort} dir={sortAtivo?.dir} onSort={sortBy} className="w-[28%]" />
                  <SortableHead label="Local" column="local" sort={sortAtivo?.sort} dir={sortAtivo?.dir} onSort={sortBy} className="w-[20%]" />
                  <SortableHead label="Propostas" column="propostas" sort={sortAtivo?.sort} dir={sortAtivo?.dir} onSort={sortBy} className="w-[12%]" />
                  <SortableHead label="Status" column="status" sort={sortAtivo?.sort} dir={sortAtivo?.dir} onSort={sortBy} className="w-[14%]" />
                  <TableHead className="w-[10%]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCarregando ? (
                  <ListSkeletonRows columns={6} />
                ) : list.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(detalheTo(row.id))}
                  >
                    <TableCell>
                      <SituacaoOrcamentoBadge situacao={row.situacaoOrcamento} />
                    </TableCell>
                    <TableCell className="truncate font-medium text-foreground">
                      <Link to={detalheTo(row.id)} className="underline-offset-2 hover:underline" onClick={(event) => event.stopPropagation()}>
                        {SOLICITACAO_TIPO_LABEL[row.tipoServico]}
                      </Link>
                    </TableCell>
                    <TableCell className="truncate">{row.local}</TableCell>
                    <TableCell className="tabular-nums">{row.totalOrcamentos ?? 0}</TableCell>
                    <TableCell>
                      <SolicitacaoStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Abrir chamado"
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(detalheTo(row.id))
                        }}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ListPanel>
          {!listaCarregando && (
          <ListPagination
            page={viewState.page}
            totalPages={totalPages}
            totalCount={totalCount}
            singular="resultado"
            pluralLabel="resultados"
            onPage={(page) => updateList({ page })}
          />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {listaCarregando ? (
            <ListSkeletonCards />
          ) : (
            <div className="space-y-3 md:hidden">
              {list.map((row) => (
                <ListRecord
                  key={row.id}
                  title={SOLICITACAO_TIPO_LABEL[row.tipoServico]}
                  onClick={() => navigate(detalheTo(row.id))}
                  fields={[
                    { label: "Status", value: <SolicitacaoStatusBadge status={row.status} /> },
                    {
                      label: "Orçamento",
                      value: row.situacaoOrcamento ? (
                        <SituacaoOrcamentoBadge situacao={row.situacaoOrcamento} />
                      ) : (
                        "—"
                      ),
                    },
                    { label: "Local", value: row.local },
                    {
                      label: "Responsável",
                      value: row.responsavel === "fornecedor" ? "Fornecedor" : "Zeladoria",
                    },
                    { label: "Fornecedor", value: row.fornecedor?.nome ?? "-" },
                    {
                      label: "Data conclusão",
                      value: row.dataConclusao
                        ? new Date(row.dataConclusao + "T00:00:00").toLocaleDateString("pt-BR")
                        : "-",
                    },
                  ]}
                  actions={
                    <Button
                      variant="outline"
                      className="min-h-11"
                      onClick={() => navigate(detalheTo(row.id))}
                    >
                      Abrir
                    </Button>
                  }
                />
              ))}
            </div>
          )}
          <ListPanel className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <SortableHead label="Status" column="status" sort={sortAtivo?.sort} dir={sortAtivo?.dir} onSort={sortBy} className="w-[12%]" />
                  <SortableHead label="Tipo de serviço" column="tipo" sort={sortAtivo?.sort} dir={sortAtivo?.dir} onSort={sortBy} className="w-[15%]" />
                  <SortableHead label="Orçamento" column="orcamento" sort={sortAtivo?.sort} dir={sortAtivo?.dir} onSort={sortBy} className="w-[18%]" />
                  <SortableHead label="Local" column="local" sort={sortAtivo?.sort} dir={sortAtivo?.dir} onSort={sortBy} className="w-[11%]" />
                  <SortableHead label="Responsável" column="responsavel" sort={sortAtivo?.sort} dir={sortAtivo?.dir} onSort={sortBy} className="w-[12%]" />
                  <SortableHead label="Fornecedor" column="fornecedor" sort={sortAtivo?.sort} dir={sortAtivo?.dir} onSort={sortBy} className="w-[12%]" />
                  <SortableHead label="Data conclusão" column="dataConclusao" sort={sortAtivo?.sort} dir={sortAtivo?.dir} onSort={sortBy} className="w-[12%]" />
                  <TableHead className="w-[8%]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCarregando ? (
                  <ListSkeletonRows columns={8} />
                ) : list.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(detalheTo(row.id))}
                  >
                    <TableCell>
                      <SolicitacaoStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="truncate font-medium text-foreground">
                      <Link
                        to={detalheTo(row.id)}
                        className="underline-offset-2 hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {SOLICITACAO_TIPO_LABEL[row.tipoServico]}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {row.situacaoOrcamento ? (
                        <Link
                          to={detalheTo(row.id)}
                          className="inline-flex"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <SituacaoOrcamentoBadge situacao={row.situacaoOrcamento} />
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="truncate">{row.local}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {row.responsavel === "fornecedor" ? "Fornecedor" : "Zeladoria"}
                      </Badge>
                    </TableCell>
                    <TableCell className="truncate">{row.fornecedor?.nome ?? "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.dataConclusao
                        ? new Date(row.dataConclusao + "T00:00:00").toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Abrir chamado"
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(detalheTo(row.id))
                        }}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ListPanel>
          {!listaCarregando && (
          <ListPagination
            page={viewState.page}
            totalPages={totalPages}
            totalCount={totalCount}
            singular="resultado"
            pluralLabel="resultados"
            onPage={(page) => updateList({ page })}
          />
          )}
        </div>
      )}
      </div>

      <SolicitacaoManutencaoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        condominioId={condominioId}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />
    </div>
  )
}

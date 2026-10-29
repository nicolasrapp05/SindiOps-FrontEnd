import { useEffect, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Hammer,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { useDebounce } from "@/hooks/useDebounce"
import { canAccessAdmin } from "@/lib/cargo-permissions"
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

function LinhaCarregando({ colunas }: { colunas: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colunas}>
        <Skeleton className="h-16 w-full" />
      </TableCell>
    </TableRow>
  )
}

function Paginacao({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (page: number) => void
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(Math.max(1, page - 1))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(Math.min(totalPages, page + 1))}
        >
          Próxima
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

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
  const viewState = useMemo<ManutencaoListParams>(
    () => (visaoOrcamentos ? parsed : { ...parsed, visao: "chamados" }),
    [parsed, visaoOrcamentos],
  )
  const canonicalQuery = useMemo(() => writeManutencaoListParams(parsed).toString(), [parsed])
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
      }
    }

    return {
      search: debouncedSearch.trim() || undefined,
      status: viewState.status === "todas" ? undefined : viewState.status,
      tipoServico: viewState.tipoServico || undefined,
      situacaoOrcamento: viewState.situacaoOrcamento || undefined,
      page: viewState.page,
      pageSize: PAGE_SIZE,
    }
  }, [debouncedSearch, viewState, visaoOrcamentos])

  const setVisao = (fila: boolean) => {
    const current = readManutencaoListParams(new URLSearchParams(query))
    setSearchParams(
      writeManutencaoListParams({
        ...current,
        visao: fila ? "orcamentos" : "chamados",
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

      {admin && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Visão da lista">
          <Button
            type="button"
            size="sm"
            variant={visaoOrcamentos ? "outline" : "default"}
            onClick={() => setVisao(false)}
          >
            Chamados
          </Button>
          <Button
            type="button"
            size="sm"
            variant={visaoOrcamentos ? "default" : "outline"}
            onClick={() => setVisao(true)}
          >
            Fila de orçamento
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {visaoOrcamentos
            ? FILTROS_FILA.map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
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
                  variant={viewState.status === tab ? "default" : "outline"}
                  onClick={() => updateList({ status: tab, page: 1 })}
                >
                  {STATUS_TAB_LABEL[tab]}
                </Button>
              ))}
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end xl:w-auto">
          <div className="relative w-full sm:w-64">
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
                className="w-full sm:w-[220px]"
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
                className="w-full sm:w-[220px]"
              />
            </>
          )}
        </div>
      </div>

      {!condoConfigured || (!isPlaceholderData && list.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <Hammer className="text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            {!condoConfigured
              ? "Condomínio não configurado"
              : visaoOrcamentos
                ? "Nenhum chamado nesta fila"
                : "Nenhuma solicitação"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {!condoConfigured
              ? "Informe o ID do condomínio para listar e criar solicitações."
              : visaoOrcamentos
                ? "Abra um chamado para registrar propostas."
                : "Abra um novo chamado de manutenção."}
          </p>
          {visaoOrcamentos && condoConfigured ? (
            <Button className="mt-6" variant="outline" onClick={() => setVisao(false)}>
              Ver chamados
            </Button>
          ) : (
            <Button
              className="mt-6"
              disabled={!condoConfigured}
              onClick={() => setFormOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Nova Solicitação
            </Button>
          )}
        </div>
      ) : visaoOrcamentos ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Situação</TableHead>
                  <TableHead>Chamado</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Propostas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPlaceholderData ? (
                  <LinhaCarregando colunas={6} />
                ) : list.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(detalheTo(row.id))}
                  >
                    <TableCell>
                      <SituacaoOrcamentoBadge situacao={row.situacaoOrcamento} />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <Link to={detalheTo(row.id)} className="underline-offset-2 hover:underline" onClick={(event) => event.stopPropagation()}>
                        {SOLICITACAO_TIPO_LABEL[row.tipoServico]}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{row.local}</TableCell>
                    <TableCell className="tabular-nums">{row.totalOrcamentos ?? 0}</TableCell>
                    <TableCell>
                      <SolicitacaoStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={detalheTo(row.id)} onClick={(event) => event.stopPropagation()}>Abrir</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Paginacao page={viewState.page} totalPages={totalPages} onPage={(page) => updateList({ page })} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo de serviço</TableHead>
                  <TableHead>Orçamento</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data conclusão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPlaceholderData ? (
                  <LinhaCarregando colunas={7} />
                ) : list.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(detalheTo(row.id))}
                  >
                    <TableCell>
                      <SolicitacaoStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
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
                    <TableCell className="max-w-[160px] truncate">{row.local}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {row.responsavel === "fornecedor" ? "Fornecedor" : "Zeladoria"}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.fornecedor?.nome ?? "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.dataConclusao
                        ? new Date(row.dataConclusao + "T00:00:00").toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Paginacao page={viewState.page} totalPages={totalPages} onPage={(page) => updateList({ page })} />
        </div>
      )}

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

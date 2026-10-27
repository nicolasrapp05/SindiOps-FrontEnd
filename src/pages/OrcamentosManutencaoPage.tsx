import { useMemo, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, Receipt, RefreshCw, Search } from "lucide-react"
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
import { useDebounce } from "@/hooks/useDebounce"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { useAuthStore } from "@/store/auth-store"
import { canAccessAdmin } from "@/lib/cargo-permissions"
import { SolicitacaoStatusBadge } from "@/features/manutencoes/components/SolicitacaoStatusBadge"
import { SituacaoOrcamentoBadge } from "@/features/manutencoes/components/SituacaoOrcamentoBadge"
import { useSolicitacoesManutencao } from "@/features/manutencoes/hooks/useSolicitacoesManutencao"
import {
  SITUACAO_ORCAMENTO_LABEL,
  SOLICITACAO_TIPO_LABEL,
  type SituacaoOrcamento,
} from "@/features/manutencoes/types/solicitacao-manutencao.types"

const PAGE_SIZE = 10

const FILTROS = ["pendentes", ...Object.keys(SITUACAO_ORCAMENTO_LABEL), "todas"] as const
type FiltroFila = (typeof FILTROS)[number]

const FILTRO_LABEL: Record<FiltroFila, string> = {
  pendentes: "Pendentes",
  ...SITUACAO_ORCAMENTO_LABEL,
  todas: "Todas",
}

export default function OrcamentosManutencaoPage() {
  const cargo = useAuthStore((s) => s.user?.cargo)
  const condominioId = useCondominioScopeStore((s) => s.selectedCondominioId) ?? ""
  const [filtro, setFiltro] = useState<FiltroFila>("pendentes")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      situacaoOrcamento:
        filtro !== "pendentes" && filtro !== "todas" ? (filtro as SituacaoOrcamento) : undefined,
      pendenteOrcamento: filtro === "pendentes" ? true : undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedSearch, filtro, page],
  )

  const admin = canAccessAdmin(cargo)
  const { data, isLoading, isError, refetch } = useSolicitacoesManutencao(
    admin ? condominioId : "",
    filters,
  )
  const list = data?.data ?? []
  const totalCount = data?.totalCount
  const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1
  const condoConfigured = !!condominioId

  if (cargo && !canAccessAdmin(cargo)) return <Navigate to="/manutencoes" replace />

  if (condoConfigured && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (condoConfigured && isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Receipt className="text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Erro ao carregar orçamentos</h3>
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Orçamentos de manutenção</h1>
        <p className="mt-1 text-sm text-gray-500">
          Chamados que ainda pedem uma proposta, uma escolha ou a aprovação do síndico.
        </p>
      </div>

      {!condoConfigured && (
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
          Selecione um condomínio na barra lateral para ver os orçamentos.
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={filtro === item ? "default" : "outline"}
              onClick={() => {
                setFiltro(item)
                setPage(1)
              }}
            >
              {FILTRO_LABEL[item]}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            aria-label="Buscar chamados"
            placeholder="Buscar…"
            className="pl-10"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {!condoConfigured || list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <Receipt className="text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            {!condoConfigured ? "Condomínio não configurado" : "Nenhum chamado nesta fila"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {!condoConfigured
              ? "Selecione um condomínio para listar os orçamentos."
              : "Abra um chamado em Manutenções para registrar propostas."}
          </p>
          {condoConfigured && (
            <Button className="mt-6" variant="outline" asChild>
              <Link to="/manutencoes">Ir para manutenções</Link>
            </Button>
          )}
        </div>
      ) : (
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
                {list.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <SituacaoOrcamentoBadge situacao={row.situacaoOrcamento} />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {SOLICITACAO_TIPO_LABEL[row.tipoServico]}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{row.local}</TableCell>
                    <TableCell className="tabular-nums">{row.totalOrcamentos ?? 0}</TableCell>
                    <TableCell>
                      <SolicitacaoStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/manutencoes/${row.id}`}>Abrir</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Hammer,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDebounce } from "@/hooks/useDebounce"
import { Link } from "react-router-dom"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { SolicitacaoStatusBadge } from "@/features/manutencoes/components/SolicitacaoStatusBadge"
import SolicitacaoManutencaoForm from "@/features/manutencoes/components/SolicitacaoManutencaoForm"
import {
  useSolicitacoesManutencao,
  useCreateSolicitacaoManutencao,
  useUpdateSolicitacaoStatus,
} from "@/features/manutencoes/hooks/useSolicitacoesManutencao"
import {
  SOLICITACAO_TIPO_LABEL,
  type CreateSolicitacaoManutencaoRequest,
  type SolicitacaoManutencao,
  type SolicitacaoStatus,
  type SolicitacaoTipoServico,
} from "@/features/manutencoes/types/solicitacao-manutencao.types"

const PAGE_SIZE = 10

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

const ALL_STATUS: SolicitacaoStatus[] = ["nova", "em_andamento", "finalizada", "cancelada"]

export default function ManutencoesPage() {
  const condominioId = useCondominioScopeStore((s) => s.selectedCondominioId) ?? ""

  const [statusTab, setStatusTab] = useState<SolicitacaoStatus | "todas">("todas")
  const [tipoFilter, setTipoFilter] = useState<SolicitacaoTipoServico | "">("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)

  const debouncedSearch = useDebounce(search)

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: statusTab === "todas" ? undefined : statusTab,
      tipoServico: tipoFilter || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedSearch, statusTab, tipoFilter, page],
  )

  const { data, isLoading, isFetching, isError, refetch } = useSolicitacoesManutencao(
    condominioId,
    filters,
  )

  const createMutation = useCreateSolicitacaoManutencao()
  const updateStatusMutation = useUpdateSolicitacaoStatus()

  const list = data?.data ?? []
  const totalCount = data?.totalCount
  const totalPages =
    totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1

  const handleCreate = (payload: CreateSolicitacaoManutencaoRequest) => {
    createMutation.mutate(payload, { onSuccess: () => setFormOpen(false) })
  }

  const statusChange = (row: SolicitacaoManutencao, status: SolicitacaoStatus) => {
    updateStatusMutation.mutate({
      id: row.id,
      status,
      dataConclusao:
        status === "finalizada" ? new Date().toISOString().slice(0, 10) : undefined,
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
          <Hammer className="h-8 w-8 text-red-500" />
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
            Solicitações de Manutenção
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe e gerencie os chamados de manutenção.
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
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab}
              type="button"
              size="sm"
              variant={statusTab === tab ? "default" : "outline"}
              onClick={() => {
                setStatusTab(tab)
                setPage(1)
              }}
            >
              {STATUS_TAB_LABEL[tab]}
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
            value={tipoFilter || "__all__"}
            onValueChange={(v) => {
              setTipoFilter(v === "__all__" ? "" : (v as SolicitacaoTipoServico))
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os tipos</SelectItem>
              {TIPOS.map((t) => (
                <SelectItem key={t} value={t}>
                  {SOLICITACAO_TIPO_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!condoConfigured || list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <Hammer className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            {!condoConfigured ? "Condomínio não configurado" : "Nenhuma solicitação"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {!condoConfigured
              ? "Informe o ID do condomínio para listar e criar solicitações."
              : "Abra um novo chamado de manutenção."}
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
          <div className={`overflow-hidden rounded-xl bg-white shadow-sm transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo de serviço</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data conclusão</TableHead>
                  <TableHead className="min-w-[200px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <SolicitacaoStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {SOLICITACAO_TIPO_LABEL[row.tipoServico]}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate">{row.local}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {row.responsavel === "fornecedor" ? "Fornecedor" : "Zeladoria"}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.fornecedor?.nome ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.dataConclusao
                        ? new Date(row.dataConclusao + "T00:00:00").toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">Atualizar status</span>
                        <Select
                          value={row.status}
                          onValueChange={(v) => statusChange(row, v as SolicitacaoStatus)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="h-8 w-full min-w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_STATUS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_TAB_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
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

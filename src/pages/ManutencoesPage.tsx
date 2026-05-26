import { useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Hammer,
  Plus,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
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

const PAGE_SIZE = 20

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
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)

  const filters = useMemo(
    () => ({
      status: statusTab === "todas" ? undefined : statusTab,
      tipoServico: tipoFilter || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [statusTab, tipoFilter, page],
  )

  const { data, isLoading, isError, refetch, isFetching } = useSolicitacoesManutencao(
    condominioId,
    filters,
  )

  const createMutation = useCreateSolicitacaoManutencao()
  const updateStatusMutation = useUpdateSolicitacaoStatus()

  const list = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const totalCount = (data as { totalCount?: number } | undefined)?.totalCount
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

  if (!condominioId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Solicitações de Manutenção
        </h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Selecione um condomínio na barra lateral para carregar as solicitações. Cadastre em{" "}
          <Link to="/condominios" className="font-medium text-emerald-800 underline underline-offset-2">
            Condomínios
          </Link>
          .
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Hammer className="h-10 w-10 text-red-500" />
        <h3 className="mt-4 text-lg font-semibold">Erro ao carregar solicitações</h3>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Solicitações de Manutenção
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab}
                type="button"
                size="sm"
                variant={statusTab === tab ? "default" : "ghost"}
                className={cn(statusTab === tab && "bg-white shadow-sm", "text-xs sm:text-sm")}
                onClick={() => {
                  setStatusTab(tab)
                  setPage(1)
                }}
              >
                {STATUS_TAB_LABEL[tab]}
              </Button>
            ))}
          </div>
          <Select
            value={tipoFilter || "__all__"}
            onValueChange={(v) => {
              setTipoFilter(v === "__all__" ? "" : (v as SolicitacaoTipoServico))
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[200px]">
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
          <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={() => setFormOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Solicitação
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20">
          <Hammer className="h-10 w-10 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Nenhuma solicitação</h3>
          <p className="mt-1 text-sm text-gray-500">Abra um novo chamado de manutenção.</p>
          <Button className="mt-6 bg-emerald-700 hover:bg-emerald-800" onClick={() => setFormOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Solicitação
          </Button>
        </div>
      ) : (
        <div className="relative rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          {isFetching && !isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/50">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-700" />
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages}
                {totalCount != null && ` · ${totalCount} itens`}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
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

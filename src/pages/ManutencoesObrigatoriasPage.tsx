import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { ManutencaoStatusBadge } from "@/features/manutencoes/components/ManutencaoStatusBadge"
import ManutencaoObrigatoriaForm from "@/features/manutencoes/components/ManutencaoObrigatoriaForm"
import RealizarManutencaoModal from "@/features/manutencoes/components/RealizarManutencaoModal"
import ConfirmDialog from "@/components/shared/ConfirmDialog"
import {
  useManutencoesObrigatorias,
  useCreateManutencaoObrigatoria,
  useUpdateManutencaoObrigatoria,
  useRealizarManutencao,
  useDeleteManutencaoObrigatoria,
} from "@/features/manutencoes/hooks/useManutencoesObrigatorias"
import {
  MANUTENCAO_TIPO_LABEL,
  type CreateManutencaoObrigatoriaRequest,
  type ManutencaoObrigatoria,
  type ManutencaoStatus,
  type ManutencaoTipo,
} from "@/features/manutencoes/types/manutencao-obrigatoria.types"

const PAGE_SIZE = 10

const TIPOS = Object.keys(MANUTENCAO_TIPO_LABEL) as ManutencaoTipo[]

type StatusTab = "todas" | ManutencaoStatus

const TAB_LABELS: Record<StatusTab, string> = {
  todas: "Todas",
  overdue: "Vencidas",
  upcoming: "Próximas",
  ok: "OK",
}

export default function ManutencoesObrigatoriasPage() {
  const condominioId = useCondominioScopeStore((s) => s.selectedCondominioId) ?? ""
  const condominioNome = useCondominioScopeStore((s) => s.selectedCondominioNome)

  const [statusTab, setStatusTab] = useState<StatusTab>("todas")
  const [tipoFilter, setTipoFilter] = useState<ManutencaoTipo | "">("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ManutencaoObrigatoria | null>(null)
  const [realizarOpen, setRealizarOpen] = useState(false)
  const [realizarId, setRealizarId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ManutencaoObrigatoria | null>(null)

  const filters = useMemo(
    () => ({
      status: statusTab === "todas" ? undefined : statusTab,
      tipo: tipoFilter || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [statusTab, tipoFilter, page],
  )

  const { data, isLoading, isError, refetch, isFetching } = useManutencoesObrigatorias(
    condominioId,
    filters,
  )

  const createMutation = useCreateManutencaoObrigatoria()
  const updateMutation = useUpdateManutencaoObrigatoria()
  const realizarMutation = useRealizarManutencao()
  const deleteMutation = useDeleteManutencaoObrigatoria()

  const rawList = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const totalCount = (data as { totalCount?: number } | undefined)?.totalCount

  const sortedList = useMemo(
    () =>
      [...rawList].sort(
        (a, b) =>
          new Date(a.dataVencimento + "T00:00:00").getTime() -
          new Date(b.dataVencimento + "T00:00:00").getTime(),
      ),
    [rawList],
  )

  const totalPages =
    totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (m: ManutencaoObrigatoria) => {
    setEditing(m)
    setFormOpen(true)
  }

  const handleDelete = (m: ManutencaoObrigatoria) => {
    setPendingDelete(m)
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success("Manutenção removida com sucesso")
        setPendingDelete(null)
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Erro ao remover")
        setPendingDelete(null)
      },
    })
  }

  const handleFormSubmit = (payload: CreateManutencaoObrigatoriaRequest) => {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setFormOpen(false) },
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => setFormOpen(false) })
    }
  }

  const openRealizar = (id: string) => {
    setRealizarId(id)
    setRealizarOpen(true)
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
          <ClipboardList className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Erro ao carregar manutenções</h3>
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
            Manutenções Obrigatórias
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Controle as obrigações periódicas e vencimentos do condomínio.
          </p>
        </div>
        <Button
          className="shrink-0 bg-emerald-700 hover:bg-emerald-800"
          disabled={!condoConfigured}
          onClick={openCreate}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nova Manutenção
        </Button>
      </div>

      {!condoConfigured && (
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
          Selecione um condomínio na barra lateral para carregar manutenções e habilitar novos
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
          {(Object.keys(TAB_LABELS) as StatusTab[]).map((tab) => (
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
              {TAB_LABELS[tab]}
            </Button>
          ))}
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end xl:w-auto">
          <Select
            value={tipoFilter || "__all__"}
            onValueChange={(v) => {
              setTipoFilter(v === "__all__" ? "" : (v as ManutencaoTipo))
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
                  {MANUTENCAO_TIPO_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!condoConfigured || sortedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <ClipboardList className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            {!condoConfigured ? "Condomínio não configurado" : "Nenhuma manutenção"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {!condoConfigured
              ? "Informe o ID do condomínio para listar e criar manutenções."
              : "Cadastre a primeira obrigação."}
          </p>
          <Button
            className="mt-6 bg-emerald-700 hover:bg-emerald-800"
            disabled={!condoConfigured}
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Manutenção
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Condomínio</TableHead>
                  <TableHead>Data vencimento</TableHead>
                  <TableHead>Última realização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedList.map((m) => (
                  <TableRow
                    key={m.id}
                    className={cn(m.status === "overdue" && "bg-red-50/50")}
                  >
                    <TableCell className="font-medium text-gray-900">
                      {MANUTENCAO_TIPO_LABEL[m.tipo]}
                    </TableCell>
                    <TableCell>{m.condominio.nome}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(m.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {m.ultimaRealizacao
                        ? new Date(m.ultimaRealizacao + "T00:00:00").toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <ManutencaoStatusBadge status={m.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                          onClick={() => openRealizar(m.id)}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Marcar como Realizada
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(m)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(m)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      <ManutencaoObrigatoriaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        condominioId={condominioId}
        condominioNome={condominioNome}
        manutencao={editing}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <RealizarManutencaoModal
        open={realizarOpen}
        onOpenChange={(o) => {
          setRealizarOpen(o)
          if (!o) setRealizarId(null)
        }}
        manutencaoId={realizarId ?? ""}
        isSubmitting={realizarMutation.isPending}
        onConfirm={(body) => {
          if (!realizarId) return
          realizarMutation.mutate(
            { id: realizarId, data: body },
            {
              onSuccess: () => {
                setRealizarOpen(false)
                setRealizarId(null)
              },
            },
          )
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Remover manutenção"
        description={`Tem certeza que deseja remover "${pendingDelete ? MANUTENCAO_TIPO_LABEL[pendingDelete.tipo] : ""}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}

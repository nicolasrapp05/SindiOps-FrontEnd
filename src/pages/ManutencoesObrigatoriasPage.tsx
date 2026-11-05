import { useMemo, useState } from "react"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import {
  CheckCircle2,
  ClipboardList,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/useDebounce"
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
import { nextSort, type SortColumn, type SortDir } from "@/lib/list-sort"
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
const SORT_COLUMNS: SortColumn[] = [
  { key: "tipo", label: "Tipo" },
  { key: "condominio", label: "Condomínio" },
  { key: "vencimento", label: "Data vencimento" },
  { key: "ultimaRealizacao", label: "Última realização" },
  { key: "status", label: "Status" },
]

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
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string>()
  const [dir, setDir] = useState<SortDir>()
  const [formOpen, setFormOpen] = useState(false)

  const debouncedSearch = useDebounce(search)
  const [editing, setEditing] = useState<ManutencaoObrigatoria | null>(null)
  const [realizarOpen, setRealizarOpen] = useState(false)
  const [realizarId, setRealizarId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ManutencaoObrigatoria | null>(null)

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: statusTab === "todas" ? undefined : statusTab,
      tipo: tipoFilter || undefined,
      page,
      pageSize: PAGE_SIZE,
      sort,
      dir,
    }),
    [debouncedSearch, statusTab, tipoFilter, page, sort, dir],
  )

  const sortBy = (column: string) => {
    const next = nextSort(sort, dir, column)
    setSort(next.sort)
    setDir(next.dir)
    setPage(1)
  }

  const { data, isLoading, isPlaceholderData, isError, refetch } = useManutencoesObrigatorias(
    condominioId,
    filters,
  )

  const createMutation = useCreateManutencaoObrigatoria()
  const updateMutation = useUpdateManutencaoObrigatoria()
  const realizarMutation = useRealizarManutencao()
  const deleteMutation = useDeleteManutencaoObrigatoria()

  const list = data?.data ?? []

  const totalCount = data?.totalCount
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
        toast.error(getApiErrorMessage(err, "Erro ao remover"))
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
  const listaCarregando = condoConfigured && (isLoading || isPlaceholderData)

  if (condoConfigured && isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <ClipboardList className="text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Erro ao carregar manutenções</h3>
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
            Manutenções Obrigatórias
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Controle as obrigações periódicas e vencimentos do condomínio.
          </p>
        </div>
        <Button
          className="shrink-0"
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
              className="min-h-11"
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
        <div className="grid grid-cols-2 gap-3 xl:flex xl:w-auto xl:items-center xl:justify-end xl:gap-2">
          <ListSortMenu
            columns={SORT_COLUMNS}
            sort={sort}
            dir={dir}
            onChange={(nextSortKey, nextDir) => {
              setSort(nextSortKey)
              setDir(nextDir)
              setPage(1)
            }}
            className="w-full min-w-0 md:hidden"
          />
          <div className="relative w-full min-w-0 xl:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              autoComplete="off"
              spellCheck={false}
              aria-label="Buscar manutenções obrigatórias"
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
            options={[
              { value: "", label: "Todos os tipos" },
              ...TIPOS.map((t) => ({ value: t, label: MANUTENCAO_TIPO_LABEL[t] })),
            ]}
            value={tipoFilter || ""}
            onValueChange={(v) => { setTipoFilter(v as ManutencaoTipo | ""); setPage(1) }}
            placeholder="Buscar…"
            className="w-full min-w-0 xl:w-[220px]"
          />
        </div>
      </div>

      {!condoConfigured || (!listaCarregando && list.length === 0) ? (
        <EmptyState
          icon={ClipboardList}
          title={!condoConfigured ? "Condomínio não configurado" : "Nenhuma manutenção"}
          description={
            !condoConfigured
              ? "Informe o ID do condomínio para listar e criar manutenções."
              : "Cadastre a primeira obrigação."
          }
          action={
            <Button disabled={!condoConfigured} onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nova Manutenção
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {listaCarregando ? (
            <ListSkeletonCards />
          ) : (
          <div className="space-y-3 md:hidden">
            {list.map((m) => (
              <ListRecord
                key={m.id}
                className={cn(m.status === "overdue" && "bg-red-50/50")}
                title={MANUTENCAO_TIPO_LABEL[m.tipo]}
                fields={[
                  { label: "Condomínio", value: m.condominio.nome },
                  {
                    label: "Data vencimento",
                    value: new Date(m.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR"),
                  },
                  {
                    label: "Última realização",
                    value: m.ultimaRealizacao
                      ? new Date(m.ultimaRealizacao + "T00:00:00").toLocaleDateString("pt-BR")
                      : "-",
                  },
                  { label: "Status", value: <ManutencaoStatusBadge status={m.status} /> },
                ]}
                actions={
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                      onClick={() => openRealizar(m.id)}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Marcar como Realizada
                    </Button>
                    <Button type="button" variant="ghost" className="min-h-11" onClick={() => openEdit(m)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11 text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(m)}
                    >
                      Excluir
                    </Button>
                  </>
                }
              />
            ))}
          </div>
          )}
          <ListPanel className="hidden md:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <SortableHead label="Tipo" column="tipo" sort={sort} dir={dir} onSort={sortBy} className="w-[14%]" />
                  <SortableHead label="Condomínio" column="condominio" sort={sort} dir={dir} onSort={sortBy} className="w-[14%]" />
                  <SortableHead label="Data vencimento" column="vencimento" sort={sort} dir={dir} onSort={sortBy} className="w-[13%]" />
                  <SortableHead label="Última realização" column="ultimaRealizacao" sort={sort} dir={dir} onSort={sortBy} className="w-[14%]" />
                  <SortableHead label="Status" column="status" sort={sort} dir={dir} onSort={sortBy} className="w-[10%]" />
                  <TableHead className="w-[35%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCarregando ? (
                  <ListSkeletonRows columns={6} />
                ) : list.map((m) => (
                  <TableRow
                    key={m.id}
                    className={cn(m.status === "overdue" && "bg-red-50/50")}
                  >
                    <TableCell className="truncate font-medium text-foreground">
                      {MANUTENCAO_TIPO_LABEL[m.tipo]}
                    </TableCell>
                    <TableCell className="truncate">{m.condominio.nome}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(m.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {m.ultimaRealizacao
                        ? new Date(m.ultimaRealizacao + "T00:00:00").toLocaleDateString("pt-BR")
                        : "-"}
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
                          
                          onClick={() => openEdit(m)}
                         aria-label="Editar">
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(m)}
                         aria-label="Excluir">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ListPanel>
          {!listaCarregando && (
          <ListPagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            singular="resultado"
            pluralLabel="resultados"
            onPage={setPage}
          />
          )}
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

import { useMemo, useState } from "react"
import { Plus, RefreshCw, Users, Mail, Pencil, Trash2, UserCheck, UserX } from "lucide-react"
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
import Combobox from "@/components/shared/Combobox"
import ConfirmDialog from "@/components/shared/ConfirmDialog"
import EmptyState from "@/components/shared/EmptyState"
import ListPagination from "@/components/shared/ListPagination"
import ListPanel from "@/components/shared/ListPanel"
import ListRecord from "@/components/shared/ListRecord"
import ListSortMenu from "@/components/shared/ListSortMenu"
import SortableHead from "@/components/shared/SortableHead"
import { nextSort, type SortColumn, type SortDir } from "@/lib/list-sort"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  useFuncionarios,
  useConvidarFuncionario,
  useUpdateFuncionario,
  useReenviarConviteFuncionario,
  useAtivarFuncionario,
  useDesativarFuncionario,
  useDeleteFuncionario,
} from "@/features/configuracoes/hooks/useFuncionarios"
import {
  CARGO_LABEL,
  type ConvidarFuncionarioRequest,
  type Funcionario,
  type FuncionarioCargo,
  type UpdateFuncionarioRequest,
} from "@/features/configuracoes/types/funcionario.types"
import FuncionarioStatusBadge from "@/features/configuracoes/components/FuncionarioStatusBadge"
import ConvidarFuncionarioModal from "@/features/configuracoes/components/ConvidarFuncionarioModal"
import EditarFuncionarioModal from "@/features/configuracoes/components/EditarFuncionarioModal"
import { cn, getInitials } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

const PAGE_SIZE = 20
const SORT_COLUMNS: SortColumn[] = [
  { key: "nome", label: "Nome" },
  { key: "cargo", label: "Cargo" },
  { key: "email", label: "E-mail" },
  { key: "criadoEm", label: "Data de cadastro" },
]

type CargoFilter = FuncionarioCargo | "todas"
type AtivoFilter = "todos" | "ativos" | "inativos"

export default function EquipePage() {
  const [cargoFilter, setCargoFilter] = useState<CargoFilter>("todas")
  const [ativoFilter, setAtivoFilter] = useState<AtivoFilter>("todos")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string>()
  const [dir, setDir] = useState<SortDir>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Funcionario | null>(null)
  const [pendingDeactivate, setPendingDeactivate] = useState<Funcionario | null>(null)
  const currentUserId = useAuthStore((s) => s.user?.id)

  const apiFilters = useMemo(() => {
    return {
      cargo: cargoFilter === "todas" ? undefined : cargoFilter,
      ativo:
        ativoFilter === "todos"
          ? undefined
          : ativoFilter === "ativos"
            ? true
            : false,
      page,
      pageSize: PAGE_SIZE,
      sort,
      dir,
    }
  }, [cargoFilter, ativoFilter, page, sort, dir])

  const sortBy = (column: string) => {
    const next = nextSort(sort, dir, column)
    setSort(next.sort)
    setDir(next.dir)
    setPage(1)
  }

  const { data, isLoading, isError, refetch } = useFuncionarios(apiFilters)
  const convidar = useConvidarFuncionario()
  const atualizar = useUpdateFuncionario()
  const reenviarConvite = useReenviarConviteFuncionario()
  const ativar = useAtivarFuncionario()
  const desativar = useDesativarFuncionario()
  const excluir = useDeleteFuncionario()

  const list = data?.data ?? []
  const totalCount = data?.totalCount
  const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1
  const CARGOS: CargoFilter[] = ["todas", "zelador", "secretario", "porteiro", "outro"]

  const handleConvidar = (payload: ConvidarFuncionarioRequest) => {
    convidar.mutate(payload, { onSuccess: () => setModalOpen(false) })
  }

  const handleEditar = (payload: UpdateFuncionarioRequest) => {
    if (!editingFuncionario) return
    atualizar.mutate(
      { id: editingFuncionario.id, data: payload },
      {
        onSuccess: () => {
          setEditModalOpen(false)
          setEditingFuncionario(null)
        },
      },
    )
  }

  const openEditModal = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario)
    setEditModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    excluir.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    })
  }

  const handleConfirmDeactivate = () => {
    if (!pendingDeactivate) return
    desativar.mutate(pendingDeactivate.id, {
      onSuccess: () => setPendingDeactivate(null),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-12 w-full max-w-md" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Users className="text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Erro ao carregar equipe</h3>
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Equipe</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie convites, cargos e acesso.</p>
        </div>
        <Button
          className="shrink-0"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Convidar Funcionário
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <ListSortMenu
          columns={SORT_COLUMNS}
          sort={sort}
          dir={dir}
          onChange={(nextSortKey, nextDir) => {
            setSort(nextSortKey)
            setDir(nextDir)
            setPage(1)
          }}
        />
        <Combobox
          options={CARGOS.map((c) => ({
            value: c,
            label: c === "todas" ? "Todos os cargos" : CARGO_LABEL[c],
          }))}
          value={cargoFilter}
          onValueChange={(v) => {
            setCargoFilter(v as CargoFilter)
            setPage(1)
          }}
          placeholder="Buscar…"
          className="w-full sm:w-[200px]"
        />
        <Combobox
          options={[
            { value: "todos", label: "Todos os status" },
            { value: "ativos", label: "Ativos" },
            { value: "inativos", label: "Inativos" },
          ]}
          value={ativoFilter}
          onValueChange={(v) => {
            setAtivoFilter(v as AtivoFilter)
            setPage(1)
          }}
          placeholder="Buscar…"
          className="w-full sm:w-[200px]"
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum funcionário"
          description="Convide o primeiro membro da equipe."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Convidar Funcionário
            </Button>
          }
        />
      ) : (
        <>
        <div className="space-y-3 md:hidden">
          {list.map((f) => (
            <ListRecord
              key={f.id}
              className={cn(!f.ativo && "opacity-60")}
              title={f.nome}
              fields={[
                { label: "Cargo", value: CARGO_LABEL[f.cargo] },
                { label: "Email", value: f.email },
                {
                  label: "Condomínios",
                  value: f.condominios?.length ? f.condominios.map((c) => c.nome).join(", ") : "Todos",
                },
                {
                  label: "Status",
                  value: <FuncionarioStatusBadge ativo={f.ativo} convitePendente={f.convitePendente} />,
                },
                { label: "Data de cadastro", value: new Date(f.criadoEm).toLocaleDateString("pt-BR") },
              ]}
              actions={
                <>
                  {f.ativo && f.convitePendente && (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11"
                      disabled={reenviarConvite.isPending}
                      onClick={() => reenviarConvite.mutate(f.id)}
                    >
                      Reenviar convite
                    </Button>
                  )}
                  {f.ativo ? (
                    f.id !== currentUserId && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11 text-amber-600 hover:text-amber-800"
                        disabled={desativar.isPending}
                        onClick={() => setPendingDeactivate(f)}
                      >
                        Desativar
                      </Button>
                    )
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 text-emerald-700"
                      disabled={ativar.isPending}
                      onClick={() => ativar.mutate(f.id)}
                    >
                      Ativar
                    </Button>
                  )}
                  <Button type="button" variant="ghost" className="min-h-11" onClick={() => openEditModal(f)}>
                    Editar
                  </Button>
                  {f.id !== currentUserId && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11 text-red-500 hover:text-red-700"
                      onClick={() => setPendingDelete(f)}
                    >
                      Remover
                    </Button>
                  )}
                </>
              }
            />
          ))}
        </div>
        <ListPanel className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableHead label="Nome" column="nome" sort={sort} dir={dir} onSort={sortBy} />
                  <SortableHead label="Cargo" column="cargo" sort={sort} dir={dir} onSort={sortBy} />
                  <SortableHead label="Email" column="email" sort={sort} dir={dir} onSort={sortBy} />
                  <TableHead>Condomínios</TableHead>
                  <TableHead>Status</TableHead>
                  <SortableHead label="Data de cadastro" column="criadoEm" sort={sort} dir={dir} onSort={sortBy} />
                  <TableHead className="w-36 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((f) => (
                  <TableRow key={f.id} className="transition-colors hover:bg-muted/60">
                    <TableCell className={cn(!f.ativo && "opacity-60")}>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {getInitials(f.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{f.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("text-gray-600", !f.ativo && "opacity-60")}>
                      {CARGO_LABEL[f.cargo]}
                    </TableCell>
                    <TableCell className={cn("text-gray-500", !f.ativo && "opacity-60")}>
                      {f.email}
                    </TableCell>
                    <TableCell className={cn("max-w-[200px]", !f.ativo && "opacity-60")}>
                      {f.condominios?.length ? (
                        <span className="line-clamp-2 text-sm text-muted-foreground">
                          {f.condominios.map((c) => c.nome).join(", ")}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Todos</span>
                      )}
                    </TableCell>
                    <TableCell className={cn(!f.ativo && "opacity-60")}>
                      <FuncionarioStatusBadge ativo={f.ativo} convitePendente={f.convitePendente} />
                    </TableCell>
                    <TableCell className={cn("whitespace-nowrap text-gray-500", !f.ativo && "opacity-60")}>
                      {new Date(f.criadoEm).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {f.ativo && f.convitePendente && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            
                            title="Reenviar convite"
                            disabled={reenviarConvite.isPending}
                            onClick={() => reenviarConvite.mutate(f.id)}
                           aria-label="Reenviar convite">
                            <Mail className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                        {f.ativo ? (
                          f.id !== currentUserId && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-amber-600 hover:text-amber-800"
                              title="Desativar"
                              disabled={desativar.isPending}
                              onClick={() => setPendingDeactivate(f)}
                             aria-label="Desativar">
                              <UserX className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-emerald-600 hover:text-emerald-800"
                            title="Ativar"
                            disabled={ativar.isPending}
                            onClick={() => ativar.mutate(f.id)}
                           aria-label="Ativar">
                            <UserCheck className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          
                          title="Editar"
                          onClick={() => openEditModal(f)}
                         aria-label="Editar">
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        {f.id !== currentUserId && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            title="Remover"
                            onClick={() => setPendingDelete(f)}
                           aria-label="Remover">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </ListPanel>
        <ListPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          singular="funcionário"
          pluralLabel="funcionários"
          onPage={setPage}
        />
        </>
      )}

      <ConvidarFuncionarioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        isSubmitting={convidar.isPending}
        onSubmit={handleConvidar}
      />

      <EditarFuncionarioModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open)
          if (!open) setEditingFuncionario(null)
        }}
        funcionario={editingFuncionario}
        isSubmitting={atualizar.isPending}
        onSubmit={handleEditar}
      />

      <ConfirmDialog
        open={!!pendingDeactivate}
        onOpenChange={(open) => !open && setPendingDeactivate(null)}
        title="Desativar funcionário"
        description={`Desativar "${pendingDeactivate?.nome}"? O acesso será suspenso, mas o histórico será mantido.`}
        confirmLabel="Desativar"
        onConfirm={handleConfirmDeactivate}
        isPending={desativar.isPending}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Remover funcionário"
        description={`Tem certeza que deseja remover "${pendingDelete?.nome}"? O acesso será revogado permanentemente.`}
        confirmLabel="Remover"
        onConfirm={handleConfirmDelete}
        isPending={excluir.isPending}
      />
    </div>
  )
}

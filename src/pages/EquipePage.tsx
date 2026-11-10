import { useMemo, useState } from "react"
import { Plus, RefreshCw, Users, Mail, Pencil, Trash2, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { DEFAULT_PAGE_SIZE, type PageSizeOption } from "@/lib/pagination"
import ListBusy from "@/components/shared/ListBusy"
import ListPanel from "@/components/shared/ListPanel"
import ListRecord from "@/components/shared/ListRecord"
import ListRecordButton from "@/components/shared/ListRecordButton"
import { ListSkeletonCards, ListSkeletonRows } from "@/components/shared/ListSkeleton"
import ListSortMenu from "@/components/shared/ListSortMenu"
import { listColumn, listColumns, listFit, listFlex } from "@/components/shared/list-columns"
import RowActions from "@/components/shared/RowActions"
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

const SORT_COLUMNS: SortColumn[] = [
  { key: "nome", label: "Nome" },
  { key: "cargo", label: "Cargo" },
  { key: "email", label: "E-mail" },
  { key: "criadoEm", label: "Cadastro" },
]

type CargoFilter = FuncionarioCargo | "todas"
type AtivoFilter = "todos" | "ativos" | "inativos"

export default function EquipePage() {
  const [cargoFilter, setCargoFilter] = useState<CargoFilter>("todas")
  const [ativoFilter, setAtivoFilter] = useState<AtivoFilter>("todos")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE)
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
      pageSize,
      sort,
      dir,
    }
  }, [cargoFilter, ativoFilter, page, pageSize, sort, dir])

  const sortBy = (column: string) => {
    const next = nextSort(sort, dir, column)
    setSort(next.sort)
    setDir(next.dir)
    setPage(1)
  }

  const { data, isLoading, isPlaceholderData, isError, refetch } = useFuncionarios(apiFilters)
  const convidar = useConvidarFuncionario()
  const atualizar = useUpdateFuncionario()
  const reenviarConvite = useReenviarConviteFuncionario()
  const ativar = useAtivarFuncionario()
  const desativar = useDesativarFuncionario()
  const excluir = useDeleteFuncionario()

  const list = data?.data ?? []
  const totalCount = data?.totalCount
  const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1
  const listaCarregando = isLoading
  const listaAtualizando = isPlaceholderData
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

      <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-center">
        <ListSortMenu
          columns={SORT_COLUMNS}
          sort={sort}
          dir={dir}
          onChange={(nextSortKey, nextDir) => {
            setSort(nextSortKey)
            setDir(nextDir)
            setPage(1)
          }}
          className="w-full min-w-0 lg:hidden"
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
          className="w-full min-w-0 md:w-[200px]"
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
          className="w-full min-w-0 md:w-[200px]"
        />
      </div>

      {!listaCarregando && list.length === 0 ? (
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
        <ListBusy busy={listaAtualizando} className="space-y-6">
        {listaCarregando ? (
          <ListSkeletonCards />
        ) : (
        <div className="space-y-3 lg:hidden">
          {list.map((f) => (
            <ListRecord
              key={f.id}
              className={cn(!f.ativo && "opacity-60")}
              title={f.nome}
              fields={[
                {
                  label: "Status",
                  value: <FuncionarioStatusBadge ativo={f.ativo} convitePendente={f.convitePendente} />,
                },
                { label: "Cargo", value: CARGO_LABEL[f.cargo] },
                { label: "Email", value: f.email },
                {
                  label: "Condomínios",
                  value: f.condominios?.length ? f.condominios.map((c) => c.nome).join(", ") : "Todos",
                },
                { label: "Cadastro", value: new Date(f.criadoEm).toLocaleDateString("pt-BR") },
              ]}
              actions={
                <>
                  {f.ativo && f.convitePendente && (
                    <ListRecordButton
                      icon={Mail}
                      disabled={reenviarConvite.isPending}
                      onClick={() => reenviarConvite.mutate(f.id)}
                    >
                      Reenviar convite
                    </ListRecordButton>
                  )}
                  {f.ativo && f.id !== currentUserId && (
                    <ListRecordButton
                      icon={UserX}
                      tone="warning"
                      disabled={desativar.isPending}
                      onClick={() => setPendingDeactivate(f)}
                    >
                      Desativar
                    </ListRecordButton>
                  )}
                  {!f.ativo && (
                    <ListRecordButton icon={Pencil} onClick={() => openEditModal(f)}>
                      Editar
                    </ListRecordButton>
                  )}
                  {f.id !== currentUserId && (
                    <ListRecordButton
                      icon={Trash2}
                      tone="danger"
                      onClick={() => setPendingDelete(f)}
                    >
                      Remover
                    </ListRecordButton>
                  )}
                </>
              }
              primaryAction={
                f.ativo ? (
                  <ListRecordButton icon={Pencil} onClick={() => openEditModal(f)}>
                    Editar
                  </ListRecordButton>
                ) : (
                  <ListRecordButton
                    icon={UserCheck}
                    tone="success"
                    disabled={ativar.isPending}
                    onClick={() => ativar.mutate(f.id)}
                  >
                    Ativar
                  </ListRecordButton>
                )
              }
            />
          ))}
        </div>
        )}
        <ListPanel className="hidden lg:block">
            <Table
              columns={listColumns(
                listFit("6.125rem"),
                listFlex("8rem", "14rem"),
                listColumn.cargo,
                listFlex("10rem", "16rem"),
                listFlex("7rem", "12rem"),
                listColumn.date,
                listColumn.actions4,
              )}
            >
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Status</TableHead>
                  <SortableHead label="Nome" column="nome" sort={sort} dir={dir} onSort={sortBy} />
                  <SortableHead label="Cargo" column="cargo" sort={sort} dir={dir} onSort={sortBy} />
                  <SortableHead label="Email" column="email" sort={sort} dir={dir} onSort={sortBy} />
                  <TableHead>Condomínios</TableHead>
                  <SortableHead label="Cadastro" column="criadoEm" sort={sort} dir={dir} onSort={sortBy} />
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaCarregando ? (
                  <ListSkeletonRows columns={7} />
                ) : list.map((f) => (
                  <TableRow key={f.id} className="transition-colors hover:bg-muted/60">
                    <TableCell className={cn(!f.ativo && "opacity-60")}>
                      <FuncionarioStatusBadge ativo={f.ativo} convitePendente={f.convitePendente} />
                    </TableCell>
                    <TableCell className={cn(!f.ativo && "opacity-60")}>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {getInitials(f.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium text-foreground" title={f.nome}>{f.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("text-gray-600", !f.ativo && "opacity-60")}>
                      {CARGO_LABEL[f.cargo]}
                    </TableCell>
                    <TableCell className={cn("truncate text-gray-500", !f.ativo && "opacity-60")} title={f.email}>
                      {f.email}
                    </TableCell>
                    <TableCell className={cn(!f.ativo && "opacity-60")}>
                      {f.condominios?.length ? (
                        <span
                          className="line-clamp-2 whitespace-normal text-sm leading-5 text-muted-foreground"
                          title={f.condominios.map((c) => c.nome).join(", ")}
                        >
                          {f.condominios.map((c) => c.nome).join(", ")}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Todos</span>
                      )}
                    </TableCell>
                    <TableCell className={cn("whitespace-nowrap text-gray-500", !f.ativo && "opacity-60")}>
                      {new Date(f.criadoEm).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        collapse
                        items={[
                          {
                            label: "Reenviar convite",
                            icon: Mail,
                            hidden: !(f.ativo && f.convitePendente),
                            disabled: reenviarConvite.isPending,
                            onClick: () => reenviarConvite.mutate(f.id),
                          },
                          {
                            label: "Desativar",
                            icon: UserX,
                            hidden: !(f.ativo && f.id !== currentUserId),
                            disabled: desativar.isPending,
                            destructive: true,
                            buttonClassName: "text-amber-600 hover:text-amber-800",
                            onClick: () => setPendingDeactivate(f),
                          },
                          {
                            label: "Ativar",
                            icon: UserCheck,
                            hidden: f.ativo,
                            disabled: ativar.isPending,
                            buttonClassName: "text-emerald-600 hover:text-emerald-800",
                            onClick: () => ativar.mutate(f.id),
                          },
                          {
                            label: "Editar",
                            icon: Pencil,
                            onClick: () => openEditModal(f),
                          },
                          {
                            label: "Remover",
                            icon: Trash2,
                            hidden: f.id === currentUserId,
                            destructive: true,
                            buttonClassName: "text-red-500 hover:text-red-700",
                            onClick: () => setPendingDelete(f),
                          },
                        ]}
                      />
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
          singular="funcionário"
          pluralLabel="funcionários"
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
        )}
        </ListBusy>
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

import { useState } from "react"
import { Mail, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import EmptyState from "@/components/shared/EmptyState"
import ListPagination from "@/components/shared/ListPagination"
import ListPanel from "@/components/shared/ListPanel"
import ListRecord from "@/components/shared/ListRecord"
import ListSortMenu from "@/components/shared/ListSortMenu"
import SortableHead from "@/components/shared/SortableHead"
import { nextSort, type SortColumn, type SortDir } from "@/lib/list-sort"
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "@/features/comunicacao/hooks/useTemplates"
import type {
  CreateTemplateRequest,
  EmailTemplate,
} from "@/features/comunicacao/types/template.types"
import { TemplateTipoBadge } from "@/features/comunicacao/components/TemplateTipoBadge"
import { TemplateEditor } from "@/features/comunicacao/components/TemplateEditor"

const PAGE_SIZE = 20
const SORT_COLUMNS: SortColumn[] = [
  { key: "nome", label: "Nome" },
  { key: "tipo", label: "Tipo" },
  { key: "assunto", label: "Assunto" },
  { key: "atualizadoEm", label: "Última atualização" },
]

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("pt-BR")
}

export default function TemplatesPage() {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<string>()
  const [dir, setDir] = useState<SortDir>()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null)

  const { data: templates, isLoading, isError, refetch } = useTemplates({
    page,
    pageSize: PAGE_SIZE,
    sort,
    dir,
  })

  const sortBy = (column: string) => {
    const next = nextSort(sort, dir, column)
    setSort(next.sort)
    setDir(next.dir)
    setPage(1)
  }
  const createMutation = useCreateTemplate()
  const updateMutation = useUpdateTemplate()
  const deleteMutation = useDeleteTemplate()

  const list = templates?.data ?? []
  const totalCount = templates?.totalCount
  const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1

  function openCreate() {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(t: EmailTemplate) {
    setEditing(t)
    setEditorOpen(true)
  }

  function handleFormSubmit(data: CreateTemplateRequest) {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data },
        { onSuccess: () => setEditorOpen(false) },
      )
    } else {
      createMutation.mutate(data, { onSuccess: () => setEditorOpen(false) })
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Mail className="text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Erro ao carregar templates</h3>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Templates de Email</h1>
          <p className="mt-1 text-sm text-gray-500">
            Modelos reutilizáveis para comunicação com moradores.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Template
        </Button>
      </div>

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

      {list.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Nenhum template cadastrado"
          description="Crie o primeiro template de e-mail."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Criar template
            </Button>
          }
        />
      ) : (
        <>
        <div className="space-y-3 md:hidden">
          {list.map((t) => (
            <ListRecord
              key={t.id}
              title={t.nome}
              fields={[
                { label: "Tipo", value: <TemplateTipoBadge tipo={t.tipo} /> },
                { label: "Assunto", value: t.assunto },
                {
                  label: "Última atualização",
                  value: t.atualizadoEm ? formatDate(t.atualizadoEm) : `Criado em ${formatDate(t.criadoEm)}`,
                },
              ]}
              actions={
                <>
                  <Button type="button" variant="ghost" className="min-h-11" onClick={() => openEdit(t)}>
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 text-red-500 hover:text-red-700"
                    onClick={() => setDeleteTarget(t)}
                  >
                    Excluir
                  </Button>
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
                  <SortableHead label="Tipo" column="tipo" sort={sort} dir={dir} onSort={sortBy} />
                  <SortableHead label="Assunto" column="assunto" sort={sort} dir={dir} onSort={sortBy} />
                  <SortableHead label="Última atualização" column="atualizadoEm" sort={sort} dir={dir} onSort={sortBy} />
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/60">
                    <TableCell className="font-medium text-foreground">{t.nome}</TableCell>
                    <TableCell>
                      <TemplateTipoBadge tipo={t.tipo} />
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-gray-600">
                      {t.assunto}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.atualizadoEm
                        ? formatDate(t.atualizadoEm)
                        : <span className="text-xs">Criado em {formatDate(t.criadoEm)}</span>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          
                          onClick={() => openEdit(t)}
                          aria-label={`Editar ${t.nome}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setDeleteTarget(t)}
                          aria-label={`Excluir ${t.nome}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
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
          singular="modelo"
          pluralLabel="modelos"
          onPage={setPage}
        />
        </>
      )}

      <TemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editing}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir template?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O template{" "}
              <span className="font-medium text-foreground">
                {deleteTarget ? `"${deleteTarget.nome}"` : ""}
              </span>{" "}
              será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

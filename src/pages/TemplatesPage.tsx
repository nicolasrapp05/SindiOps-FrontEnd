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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR")
}

export default function TemplatesPage() {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null)

  const { data: templates, isLoading, isError, refetch } = useTemplates()
  const createMutation = useCreateTemplate()
  const updateMutation = useUpdateTemplate()
  const deleteMutation = useDeleteTemplate()

  const list = Array.isArray(templates) ? templates : []

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
          <Mail className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Erro ao carregar templates</h3>
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Templates de Email</h1>
          <p className="mt-1 text-sm text-gray-500">
            Modelos reutilizáveis para comunicação com moradores.
          </p>
        </div>
        <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <Mail className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Nenhum template cadastrado</h3>
          <p className="mt-1 text-sm text-gray-500">Crie o primeiro template de e-mail.</p>
          <Button className="mt-6 bg-emerald-700 hover:bg-emerald-800" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Criar template
          </Button>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((t) => (
                  <TableRow key={t.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{t.nome}</TableCell>
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
                          className="h-8 w-8"
                          onClick={() => openEdit(t)}
                          aria-label={`Editar ${t.nome}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => setDeleteTarget(t)}
                          aria-label={`Excluir ${t.nome}`}
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
        </div>
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

import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { useQuery } from "@tanstack/react-query"
import { getBlocos } from "@/features/condominios/services/condominios.service"
import type { Bloco } from "@/features/condominios/types/condominio.types"
import {
  useMoradores,
  useMorador,
  useCreateMorador,
  useUpdateMorador,
  useDeleteMorador,
} from "@/features/moradores/hooks/useMoradores"
import type {
  Morador,
  CreateMoradorRequest,
} from "@/features/moradores/types/morador.types"
import MoradorForm from "@/features/moradores/components/MoradorForm"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  delivered: { label: "Entregue", className: "bg-emerald-100 text-emerald-700" },
  sent: { label: "Enviado", className: "bg-blue-100 text-blue-700" },
  failed: { label: "Falhou", className: "bg-red-100 text-red-700" },
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function MoradoresPage() {
  const [search, setSearch] = useState("")
  const [blocoFilter, setBlocoFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingMorador, setEditingMorador] = useState<Morador | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const condominioId = useCondominioScopeStore((s) => s.selectedCondominioId) ?? ""
  const condoConfigured = !!condominioId

  const filters = {
    search: search || undefined,
    blocoId: blocoFilter !== "all" ? blocoFilter : undefined,
    page,
    pageSize: 20,
  }

  const { data: moradores, isLoading, isError, refetch } = useMoradores(condominioId, filters)
  const { data: blocos } = useQuery({
    queryKey: ["condominios", condominioId, "blocos"],
    queryFn: () => getBlocos(condominioId),
    enabled: !!condominioId,
  })

  const { data: moradorDetail } = useMorador(detailId ?? "")
  const createMutation = useCreateMorador()
  const updateMutation = useUpdateMorador()
  const deleteMutation = useDeleteMorador()

  const openCreate = () => {
    setEditingMorador(null)
    setFormOpen(true)
  }

  const openEdit = (m: Morador) => {
    setEditingMorador(m)
    setFormOpen(true)
  }

  const handleDelete = (m: Morador) => {
    if (!confirm(`Remover "${m.nome}"?`)) return
    deleteMutation.mutate(m.id)
  }

  const handleFormSubmit = (data: CreateMoradorRequest) => {
    if (editingMorador) {
      updateMutation.mutate(
        { id: editingMorador.id, data },
        { onSuccess: () => setFormOpen(false) },
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setFormOpen(false),
      })
    }
  }

  const totalCount = (moradores as unknown as { totalCount?: number })?.totalCount
  const moradorList = Array.isArray(moradores) ? moradores : []
  const totalPages = totalCount ? Math.ceil(totalCount / 20) : 1

  // ── Loading ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Users className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Erro ao carregar moradores</h3>
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Moradores</h1>
          {totalCount != null && (
            <p className="mt-1 text-sm text-gray-500">
              {totalCount} moradores cadastrados
            </p>
          )}
        </div>
        <Button
          className="bg-emerald-700 hover:bg-emerald-800"
          disabled={!condoConfigured}
          onClick={openCreate}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Morador
        </Button>
      </div>

      {!condoConfigured && (
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
          Selecione um condomínio na barra lateral para carregar moradores e cadastrar novos
          registros. Se ainda não houver condomínios, cadastre em{" "}
          <Link
            to="/condominios"
            className="font-medium text-emerald-800 underline underline-offset-2"
          >
            Condomínios
          </Link>
          .
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={blocoFilter}
          onValueChange={(v) => {
            setBlocoFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Bloco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Blocos</SelectItem>
            {blocos?.map((b: Bloco) => (
              <SelectItem key={b.id} value={b.id}>
                {b.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {moradorList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Nenhum morador encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Cadastre o primeiro morador do condomínio.</p>
          <Button
            className="mt-6 bg-emerald-700 hover:bg-emerald-800"
            disabled={!condoConfigured}
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Cadastrar Morador
          </Button>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>Bloco</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moradorList.map((m) => (
                  <TableRow
                    key={m.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() => setDetailId(m.id)}
                  >
                    <TableCell className="font-medium text-gray-900">{m.nome}</TableCell>
                    <TableCell className="text-gray-600">{m.bloco.nome}</TableCell>
                    <TableCell className="text-gray-600">{m.unidade.numero}</TableCell>
                    <TableCell className="text-gray-500">{m.email}</TableCell>
                    <TableCell className="text-gray-500">{m.telefone || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDetailId(m.id)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(m)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(m)
                          }}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages}
                {totalCount != null && ` · ${totalCount} moradores`}
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

      {/* Detail Sheet */}
      <Sheet open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetTitle className="sr-only">Detalhes do Morador</SheetTitle>
          {moradorDetail ? (
            <div className="space-y-6 pt-4">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                  {moradorDetail.nome
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{moradorDetail.nome}</h3>
                  <p className="text-sm text-gray-500">
                    {moradorDetail.bloco.nome} · Unidade {moradorDetail.unidade.numero}
                  </p>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-400">Email</p>
                  <p className="text-sm text-gray-800">{moradorDetail.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-400">Telefone</p>
                  <p className="text-sm text-gray-800">{moradorDetail.telefone || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-400">Cadastrado em</p>
                  <p className="text-sm text-gray-800">{formatDateTime(moradorDetail.criadoEm)}</p>
                </div>
              </div>

              {/* Email history */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Mail className="h-4 w-4" />
                  Últimos Emails Enviados
                </h4>
                {!moradorDetail.ultimosEmails?.length ? (
                  <p className="text-sm text-gray-400">Nenhum email enviado ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {moradorDetail.ultimosEmails.map((email) => {
                      const badge = STATUS_BADGE[email.statusEntrega] ?? {
                        label: email.statusEntrega,
                        className: "bg-gray-100 text-gray-700",
                      }
                      return (
                        <div
                          key={email.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {email.assunto}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDateTime(email.enviadoEm)}
                            </p>
                          </div>
                          <Badge className={badge.className}>{badge.label}</Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailId(null)
                    openEdit(moradorDetail)
                  }}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setDetailId(null)
                    handleDelete(moradorDetail)
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Excluir
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Form dialog */}
      <MoradorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        condominioId={condominioId}
        morador={editingMorador}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}

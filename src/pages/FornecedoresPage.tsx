import { Fragment, useState } from "react"
import {
  Plus,
  Search,
  Truck,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Package,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
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
  useFornecedores,
  useCreateFornecedor,
  useUpdateFornecedor,
  useDeleteFornecedor,
} from "@/features/fornecedores/hooks/useFornecedores"
import type {
  Fornecedor,
  CreateFornecedorRequest,
} from "@/features/fornecedores/types/fornecedor.types"
import FornecedorForm from "@/features/fornecedores/components/FornecedorForm"
import FornecedorExpandido from "@/features/fornecedores/components/FornecedorExpandido"

const SUMMARY_CARDS = [
  { label: "Total", icon: Package, color: "text-blue-600 bg-blue-50" },
  { label: "Vigentes", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  { label: "Pendências", icon: AlertCircle, color: "text-orange-600 bg-orange-50" },
  { label: "Este Mês", icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
] as const

export default function FornecedoresPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filters = { search: search || undefined, page, pageSize: 20 }
  const { data: fornecedores, isLoading, isError, refetch } = useFornecedores(filters)
  const createMutation = useCreateFornecedor()
  const updateMutation = useUpdateFornecedor()
  const deleteMutation = useDeleteFornecedor()

  const fornecedorList = Array.isArray(fornecedores) ? fornecedores : []
  const totalCount = (fornecedores as unknown as { totalCount?: number })?.totalCount
  const totalPages = totalCount ? Math.ceil(totalCount / 20) : 1

  const openCreate = () => {
    setEditingFornecedor(null)
    setFormOpen(true)
  }
  const openEdit = (f: Fornecedor) => {
    setEditingFornecedor(f)
    setFormOpen(true)
  }
  const handleDelete = (f: Fornecedor) => {
    if (!confirm(`Remover "${f.nome}"?`)) return
    deleteMutation.mutate(f.id)
  }
  const handleFormSubmit = (data: CreateFornecedorRequest) => {
    if (editingFornecedor) {
      updateMutation.mutate(
        { id: editingFornecedor.id, data },
        { onSuccess: () => setFormOpen(false) },
      )
    } else {
      createMutation.mutate(data, { onSuccess: () => setFormOpen(false) })
    }
  }

  // ── Loading ─────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  // ── Error ───────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Truck className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Erro ao carregar fornecedores</h3>
        <p className="mt-1 text-sm text-gray-500">Verifique sua conexão e tente novamente.</p>
        <Button variant="outline" className="mt-6" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  const summaryValues = [
    fornecedorList.length,
    fornecedorList.filter((f) => (f.servicos?.length ?? 0) > 0).length,
    0,
    0,
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Fornecedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestão centralizada de parceiros e prestadores de serviço.
          </p>
        </div>
        <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {idx === 3 && summaryValues[idx] > 0 ? "+" : ""}
                    {summaryValues[idx]}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* Table */}
      {fornecedorList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <Truck className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Nenhum fornecedor encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Cadastre o primeiro fornecedor.</p>
          <Button className="mt-6 bg-emerald-700 hover:bg-emerald-800" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Cadastrar Fornecedor
          </Button>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedorList.map((f) => {
                  const servicos = f.servicos ?? []
                  return (
                  <Fragment key={f.id}>
                    <TableRow
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() =>
                        setExpandedId(expandedId === f.id ? null : f.id)
                      }
                    >
                      <TableCell className="font-medium text-gray-900">{f.nome}</TableCell>
                      <TableCell className="text-gray-500">{f.cnpj || "—"}</TableCell>
                      <TableCell className="text-gray-600">{f.nomeContato || "—"}</TableCell>
                      <TableCell className="text-gray-500">{f.telefone || "—"}</TableCell>
                      <TableCell className="text-gray-500">{f.email || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {servicos.slice(0, 2).map((s) => (
                            <Badge key={s.id} variant="secondary" className="text-xs">
                              {s.tipo.replace(/_/g, " ")}
                            </Badge>
                          ))}
                          {servicos.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{servicos.length - 2}
                            </Badge>
                          )}
                          {servicos.length === 0 && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedId(expandedId === f.id ? null : f.id)
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
                              openEdit(f)
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
                              handleDelete(f)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === f.id && (
                      <TableRow key={`${f.id}-expand`}>
                        <TableCell colSpan={7} className="p-0">
                          <FornecedorExpandido fornecedorId={f.id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages}
                {totalCount != null && ` · ${totalCount} fornecedores`}
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

      {/* Form dialog */}
      <FornecedorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        fornecedor={editingFornecedor}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}

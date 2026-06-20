import { useMemo, useState } from "react"
import { Plus, RefreshCw, Users, Mail } from "lucide-react"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  useFuncionarios,
  useConvidarFuncionario,
  useAtivarFuncionario,
  useDesativarFuncionario,
  useReenviarConviteFuncionario,
} from "@/features/configuracoes/hooks/useFuncionarios"
import {
  CARGO_LABEL,
  type ConvidarFuncionarioRequest,
  type FuncionarioCargo,
} from "@/features/configuracoes/types/funcionario.types"
import FuncionarioStatusBadge from "@/features/configuracoes/components/FuncionarioStatusBadge"
import ConvidarFuncionarioModal from "@/features/configuracoes/components/ConvidarFuncionarioModal"
import { cn } from "@/lib/utils"

function initials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0][0]
    const b = parts[parts.length - 1][0]
    return `${a}${b}`.toUpperCase()
  }
  return nome.slice(0, 2).toUpperCase() || "?"
}

type CargoFilter = FuncionarioCargo | "todas"
type AtivoFilter = "todos" | "ativos" | "inativos"

export default function EquipePage() {
  const [cargoFilter, setCargoFilter] = useState<CargoFilter>("todas")
  const [ativoFilter, setAtivoFilter] = useState<AtivoFilter>("todos")
  const [modalOpen, setModalOpen] = useState(false)

  const apiFilters = useMemo(() => {
    return {
      cargo: cargoFilter === "todas" ? undefined : cargoFilter,
      ativo:
        ativoFilter === "todos"
          ? undefined
          : ativoFilter === "ativos"
            ? true
            : false,
    }
  }, [cargoFilter, ativoFilter])

  const { data, isLoading, isError, refetch } = useFuncionarios(apiFilters)
  const convidar = useConvidarFuncionario()
  const ativar = useAtivarFuncionario()
  const desativar = useDesativarFuncionario()
  const reenviarConvite = useReenviarConviteFuncionario()

  const list = Array.isArray(data) ? data : []

  const CARGOS: CargoFilter[] = ["todas", "zelador", "secretario", "porteiro", "outro"]

  const handleConvidar = (payload: ConvidarFuncionarioRequest) => {
    convidar.mutate(payload, { onSuccess: () => setModalOpen(false) })
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
          <Users className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Erro ao carregar equipe</h3>
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Equipe</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie convites, cargos e acesso.</p>
        </div>
        <Button
          className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Convidar Funcionário
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Combobox
          options={CARGOS.map((c) => ({
            value: c,
            label: c === "todas" ? "Todos os cargos" : CARGO_LABEL[c],
          }))}
          value={cargoFilter}
          onValueChange={(v) => setCargoFilter(v as CargoFilter)}
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
          onValueChange={(v) => setAtivoFilter(v as AtivoFilter)}
          placeholder="Buscar…"
          className="w-full sm:w-[200px]"
        />
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Nenhum funcionário</h3>
          <p className="mt-1 text-sm text-gray-500">Convide o primeiro membro da equipe.</p>
          <Button
            className="mt-6 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Convidar Funcionário
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Condomínios</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className={cn(!f.ativo && "opacity-60")}>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {initials(f.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{f.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className={cn(!f.ativo && "opacity-60")}>{CARGO_LABEL[f.cargo]}</TableCell>
                  <TableCell className={cn("text-muted-foreground", !f.ativo && "opacity-60")}>{f.email}</TableCell>
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
                  <TableCell className={cn("whitespace-nowrap text-muted-foreground", !f.ativo && "opacity-60")}>
                    {new Date(f.criadoEm).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {f.ativo && f.convitePendente && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={reenviarConvite.isPending}
                          onClick={() => reenviarConvite.mutate(f.id)}
                        >
                          <Mail className="mr-1.5 h-3.5 w-3.5" />
                          Reenviar convite
                        </Button>
                      )}
                      {f.ativo ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={desativar.isPending}
                          onClick={() => desativar.mutate(f.id)}
                        >
                          Desativar
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={ativar.isPending}
                          onClick={() => ativar.mutate(f.id)}
                        >
                          Reativar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConvidarFuncionarioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        isSubmitting={convidar.isPending}
        onSubmit={handleConvidar}
      />
    </div>
  )
}

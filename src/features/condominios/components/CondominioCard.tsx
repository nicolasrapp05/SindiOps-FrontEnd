import {
  MapPin,
  Building2,
  DoorOpen,
  CalendarDays,
  Pencil,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Condominio } from "../types/condominio.types"

function isMandatoExpirando(vencimento: string): boolean {
  if (!vencimento) return false
  const diff = new Date(vencimento).getTime() - Date.now()
  const sixtyDays = 60 * 24 * 60 * 60 * 1000
  return diff > 0 && diff <= sixtyDays
}

function formatDate(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

interface CondominioCardProps {
  condominio: Condominio
  onEdit: (c: Condominio) => void
  onDelete: (c: Condominio) => void
  onSelect: (c: Condominio) => void
  /** Seleciona o condomínio e foca a secção Estrutura (blocos/unidades). */
  onOpenBlocosUnidades?: (c: Condominio) => void
  isSelected?: boolean
}

export default function CondominioCard({
  condominio,
  onEdit,
  onDelete,
  onSelect,
  onOpenBlocosUnidades,
  isSelected,
}: CondominioCardProps) {
  const expirando = condominio.status === "expirando" || isMandatoExpirando(condominio.vencimentoMandato)

  const endereco = [
    condominio.enderecoRua,
    condominio.enderecoNumero ? `, ${condominio.enderecoNumero}` : "",
    condominio.enderecoBairro ? ` - ${condominio.enderecoBairro}` : "",
    condominio.enderecoCidade ? `, ${condominio.enderecoCidade}` : "",
  ].join("")

  return (
    <div
      className={`group cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
        isSelected ? "ring-2 ring-emerald-500" : ""
      }`}
      onClick={() => onSelect(condominio)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{condominio.nome}</h3>
        <Badge
          className={
            expirando
              ? "bg-orange-100 text-orange-700"
              : "bg-emerald-100 text-emerald-700"
          }
        >
          {expirando ? "Expirando" : "Vigente"}
        </Badge>
      </div>

      {/* Address */}
      {endereco.trim() && (
        <div className="mt-2 flex items-start gap-1.5 text-sm text-gray-500">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2">{endereco}</span>
        </div>
      )}

      {/* Counters */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span>
            <strong className="font-semibold">{condominio.totalBlocos}</strong> Blocos
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <DoorOpen className="h-4 w-4 text-gray-400" />
          <span>
            <strong className="font-semibold">{condominio.totalUnidades}</strong> Unidades
          </span>
        </div>
      </div>

      {/* Dates */}
      <div className="mt-4 space-y-1.5 border-t pt-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Eleição: {formatDate(condominio.dataEleicao)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CalendarDays className="h-3.5 w-3.5" />
          <span className={expirando ? "font-medium text-orange-600" : ""}>
            Mandato até: {formatDate(condominio.vencimentoMandato)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-1 border-t pt-3">
        {onOpenBlocosUnidades && (
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            onClick={(e) => {
              e.stopPropagation()
              onOpenBlocosUnidades(condominio)
            }}
          >
            <DoorOpen className="mr-1 h-3.5 w-3.5" />
            Blocos e unidades
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(condominio)
          }}
        >
          <Pencil className="mr-1 h-3.5 w-3.5" />
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(condominio)
          }}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Excluir
        </Button>
      </div>
    </div>
  )
}

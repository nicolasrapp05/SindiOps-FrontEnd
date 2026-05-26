import { Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Cotacao } from "../types/compra.types"

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

interface MapaCotacoesProps {
  cotacoes: Cotacao[]
  onSelecionar: (cotacaoId: string) => void
  isSelecting: boolean
  onEdit?: (cotacao: Cotacao) => void
  onDelete?: (cotacaoId: string) => void
  isDeleting?: boolean
}

export default function MapaCotacoes({
  cotacoes,
  onSelecionar,
  isSelecting,
  onEdit,
  onDelete,
  isDeleting,
}: MapaCotacoesProps) {
  const lowestTotal =
    cotacoes.length > 0 ? Math.min(...cotacoes.map((c) => c.valorTotal)) : null

  if (cotacoes.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nenhuma cotação cadastrada para esta solicitação.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cotacoes.map((c) => {
        const isBest = lowestTotal !== null && c.valorTotal === lowestTotal
        const selected = c.selecionada
        return (
          <div
            key={c.id}
            className={cn(
              "flex flex-col rounded-xl border bg-card p-4 shadow-sm",
              isBest && "border-emerald-500 ring-1 ring-emerald-500/30",
              !isBest && "border-border",
            )}
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">
                  {c.nomeEmpresa ?? c.fornecedor?.nome ?? "—"}
                </p>
                {c.nomeResponsavel && (
                  <p className="text-xs text-muted-foreground">{c.nomeResponsavel}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div className="flex flex-wrap gap-1">
                  {isBest && (
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                      MELHOR OFERTA
                    </Badge>
                  )}
                  {selected && (
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                      SELECIONADA
                    </Badge>
                  )}
                </div>
                {onEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600"
                    disabled={isDeleting}
                    onClick={() => onDelete(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Unitário</dt>
                <dd className="font-medium">{brl(c.valorUnitario)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-semibold">{brl(c.valorTotal)}</dd>
              </div>
              {c.formaPagamento && (
                <div className="pt-1">
                  <dt className="text-xs text-muted-foreground">Pagamento</dt>
                  <dd className="text-sm">{c.formaPagamento}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={selected || isSelecting}
                onClick={() => onSelecionar(c.id)}
              >
                Selecionar
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

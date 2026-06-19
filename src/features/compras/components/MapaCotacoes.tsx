import { Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { brl, getMenorValorUnitario } from "../lib/cotacao-utils"
import type { Cotacao } from "../types/compra.types"

interface MapaCotacoesProps {
  cotacoes: Cotacao[]
  onSelecionar?: (cotacaoId: string) => void
  isSelecting?: boolean
  onEdit?: (cotacao: Cotacao) => void
  onDelete?: (cotacaoId: string) => void
  isDeleting?: boolean
}

export default function MapaCotacoes({
  cotacoes,
  onSelecionar,
  isSelecting = false,
  onEdit,
  onDelete,
  isDeleting,
}: MapaCotacoesProps) {
  const menorValorUnitario = getMenorValorUnitario(cotacoes)

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
        const isBest = menorValorUnitario !== null && c.valorUnitario === menorValorUnitario
        const selected = c.selecionada
        const fornecedorNome = c.nomeEmpresa ?? c.fornecedor?.nome ?? "—"
        return (
          <div
            key={c.id}
            className={cn(
              "flex flex-col overflow-hidden rounded-xl border bg-card p-4 shadow-sm",
              selected && "border-emerald-500 ring-2 ring-emerald-500/30",
              !selected && isBest && "border-blue-500 ring-1 ring-blue-500/30",
              !selected && !isBest && "border-border",
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className="truncate font-semibold text-foreground"
                  title={fornecedorNome}
                >
                  {fornecedorNome}
                </p>
                {c.nomeResponsavel && (
                  <p
                    className="truncate text-xs text-muted-foreground"
                    title={c.nomeResponsavel}
                  >
                    {c.nomeResponsavel}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <div className="flex flex-wrap justify-end gap-1">
                  {isBest && (
                    <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                      MELHOR OFERTA
                    </Badge>
                  )}
                  {selected && !onSelecionar && (
                    <Badge className="border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      Selecionada
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
            {onSelecionar && (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full",
                    selected && "border-emerald-500 text-emerald-700 cursor-default",
                  )}
                  disabled={selected || isSelecting}
                  onClick={() => !selected && onSelecionar(c.id)}
                >
                  {selected ? "Selecionada" : "Selecionar"}
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

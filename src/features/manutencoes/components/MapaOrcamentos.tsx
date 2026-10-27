import { Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  brl,
  diferencaParaMenor,
  formatarPrazo,
  formatarValidade,
  getMenorPrazo,
  getMenorValor,
} from "../lib/orcamento-flow"
import { nomeOrcamento, type OrcamentoManutencao } from "../types/orcamento-manutencao.types"

interface MapaOrcamentosProps {
  orcamentos: OrcamentoManutencao[]
  onSelecionar?: (orcamentoId: string) => void
  isSelecting?: boolean
  onEdit?: (orcamento: OrcamentoManutencao) => void
  onDelete?: (orcamentoId: string) => void
  isDeleting?: boolean
}

export default function MapaOrcamentos({
  orcamentos,
  onSelecionar,
  isSelecting = false,
  onEdit,
  onDelete,
  isDeleting,
}: MapaOrcamentosProps) {
  const menorValor = getMenorValor(orcamentos)
  const menorPrazo = getMenorPrazo(orcamentos)

  if (orcamentos.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nenhum orçamento cadastrado para esta manutenção.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Resumo label="Propostas" value={String(orcamentos.length)} />
        <Resumo label="Menor valor" value={menorValor == null ? "—" : brl(menorValor)} />
        <Resumo label="Menor prazo" value={menorPrazo == null ? "—" : formatarPrazo(menorPrazo)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {orcamentos.map((orcamento) => {
          const nome = nomeOrcamento(orcamento)
          const selected = orcamento.selecionada
          const isBest = menorValor !== null && orcamento.valor === menorValor
          const isFast =
            menorPrazo !== null && orcamento.prazoExecucaoDias === menorPrazo
          const diferenca = diferencaParaMenor(orcamento.valor, menorValor)
          return (
            <div
              key={orcamento.id}
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border bg-card p-4 shadow-sm",
                selected && "border-emerald-500 ring-2 ring-emerald-500/30",
                !selected && isBest && "border-blue-500 ring-1 ring-blue-500/30",
                !selected && !isBest && "border-border",
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground" title={nome}>
                    {nome}
                  </p>
                  {orcamento.nomeResponsavel && (
                    <p className="truncate text-xs text-muted-foreground" title={orcamento.nomeResponsavel}>
                      {orcamento.nomeResponsavel}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {onEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={`Editar orçamento de ${nome}`}
                      onClick={() => onEdit(orcamento)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600"
                      disabled={isDeleting}
                      aria-label={`Excluir orçamento de ${nome}`}
                      onClick={() => onDelete(orcamento.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-1">
                {isBest && (
                  <Badge className="bg-blue-600 text-white hover:bg-blue-600">Menor valor</Badge>
                )}
                {isFast && (
                  <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">Menor prazo</Badge>
                )}
                {selected && (
                  <Badge className="border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                    Selecionada
                  </Badge>
                )}
              </div>

              <p className="text-lg font-semibold tabular-nums text-foreground">{brl(orcamento.valor)}</p>
              {diferenca > 0 && (
                <p className="text-xs tabular-nums text-muted-foreground">
                  {brl(diferenca)} acima da menor
                </p>
              )}

              <dl className="mt-3 space-y-2 text-sm">
                <Linha termo="Prazo" valor={formatarPrazo(orcamento.prazoExecucaoDias)} />
                <Linha termo="Validade" valor={formatarValidade(orcamento.validadeProposta)} />
                <Linha termo="Pagamento" valor={orcamento.formaPagamento || "Não informado"} />
                <Linha termo="Garantia" valor={orcamento.garantia || "Não informada"} />
                {orcamento.nomeContato && <Linha termo="Contato" valor={orcamento.nomeContato} />}
                {orcamento.descricaoEscopo && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Escopo</dt>
                    <dd className="text-sm text-foreground">{orcamento.descricaoEscopo}</dd>
                  </div>
                )}
                {orcamento.observacoes && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Observações</dt>
                    <dd className="text-sm text-foreground">{orcamento.observacoes}</dd>
                  </div>
                )}
              </dl>

              {onSelecionar && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("w-full", selected && "cursor-default border-emerald-500 text-emerald-700")}
                    disabled={selected || isSelecting}
                    onClick={() => !selected && onSelecionar(orcamento.id)}
                  >
                    {selected ? "Selecionada" : "Selecionar"}
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Resumo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

function Linha({ termo, valor }: { termo: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{termo}</dt>
      <dd className="text-right text-sm text-foreground">{valor}</dd>
    </div>
  )
}

import { COMPRA_CATEGORIA_LABEL, type SolicitacaoCompraItem } from "../types/compra.types"

interface ItensSolicitacaoListaProps {
  itens: SolicitacaoCompraItem[]
  justificativa?: string | null
}

export default function ItensSolicitacaoLista({ itens, justificativa }: ItensSolicitacaoListaProps) {
  if (itens.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum item neste pedido.</p>
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <ul className="space-y-3">
        {itens.map((item, index) => (
          <li key={item.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-sm text-foreground">
                <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}.</span>
                {item.descricao}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {COMPRA_CATEGORIA_LABEL[item.categoria]}
                {item.eReposicao ? " · Reposição" : ""}
              </p>
            </div>
            <p className="shrink-0 text-sm tabular-nums text-foreground">
              {item.quantidade}
              {item.unidade ? ` ${item.unidade}` : ""}
            </p>
          </li>
        ))}
      </ul>
      {justificativa?.trim() && (
        <p className="mt-4 text-sm text-foreground">
          <span className="font-medium">Justificativa. </span>
          {justificativa}
        </p>
      )}
    </div>
  )
}

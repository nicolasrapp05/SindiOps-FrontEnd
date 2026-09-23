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
    <div>
      <p className="mb-2 text-sm font-medium text-muted-foreground">Itens do pedido</p>
      <div className="overflow-hidden rounded-lg border bg-white">
        <ul>
          {itens.map((item, index) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 border-b px-3 py-2.5 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-medium text-gray-900">
                  <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}.</span>
                  {item.descricao}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {COMPRA_CATEGORIA_LABEL[item.categoria]}
                  {item.eReposicao ? " · Reposição" : ""}
                </p>
              </div>
              <p className="shrink-0 text-sm tabular-nums text-gray-700">
                {item.quantidade}
                {item.unidade ? ` ${item.unidade}` : ""}
              </p>
            </li>
          ))}
        </ul>
        {justificativa?.trim() && (
          <p className="border-t px-3 py-2 text-sm text-gray-600">
            <span className="font-medium text-gray-800">Justificativa. </span>
            {justificativa}
          </p>
        )}
      </div>
    </div>
  )
}

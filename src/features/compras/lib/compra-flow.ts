import type { UserCargo } from "@/types"
import {
  COMPRA_CATEGORIA_LABEL,
  type CompraStatus,
  type SolicitacaoCompraItem,
} from "../types/compra.types"

function formatarQuantidade(item: Pick<SolicitacaoCompraItem, "quantidade" | "unidade">) {
  return `${item.quantidade}${item.unidade ? ` ${item.unidade}` : ""}`
}

export function resumoItensCompra(itens: SolicitacaoCompraItem[] | undefined) {
  const lista = itens ?? []
  const categorias = [...new Set(lista.map((item) => item.categoria))]
  return {
    descricao: lista[0]?.descricao || "—",
    extras: Math.max(0, lista.length - 1),
    categoria:
      categorias.length === 0
        ? "—"
        : categorias.length === 1
          ? COMPRA_CATEGORIA_LABEL[categorias[0]]
          : "Várias",
    categoriasTitulo: categorias.map((categoria) => COMPRA_CATEGORIA_LABEL[categoria]).join(", "),
    quantidade:
      lista.length === 0 ? "—" : lista.length === 1 ? formatarQuantidade(lista[0]) : `${lista.length} itens`,
    titulo:
      lista.map((item) => `${item.descricao} (${formatarQuantidade(item)})`).join(" · ") || "—",
  }
}

export const canManageCotacoes = (status: CompraStatus) => status === "nova"

export const isSindico = (cargo: UserCargo) => cargo === "sindico"

export function getAprovarBlockReason(
  status: CompraStatus,
  totalCotacoes: number,
  temCotacaoSelecionada: boolean,
): string | null {
  if (status !== "nova") return "Apenas solicitações novas podem ser aprovadas"
  if (totalCotacoes < 1) return "Cadastre ao menos uma cotação antes de aprovar"
  if (!temCotacaoSelecionada) return "Selecione uma cotação vencedora antes de aprovar"
  return null
}

export function textoProximaAcaoCompra(input: {
  status: CompraStatus
  totalCotacoes: number
  temCotacaoSelecionada: boolean
  sindico: boolean
  aprovadoPor?: string
}): string {
  if (input.status === "finalizada") {
    return "Compra finalizada. As cotações ficam apenas para consulta."
  }
  if (input.status === "cancelada") {
    return "Solicitação cancelada. As cotações ficam bloqueadas."
  }
  if (input.status === "em_andamento") {
    const aprovacao = input.aprovadoPor ? ` Aprovada por ${input.aprovadoPor}.` : ""
    return input.sindico
      ? `A compra foi aprovada.${aprovacao} Finalize quando a entrega estiver concluída.`
      : `Compra em andamento.${aprovacao} A finalização cabe ao síndico.`
  }
  if (input.totalCotacoes < 1) return "Cadastre a primeira cotação para comparar fornecedores."
  if (!input.temCotacaoSelecionada) return "Compare as cotações e selecione uma vencedora."
  return input.sindico
    ? "Aprove a cotação selecionada para seguir com a compra."
    : "Cotação selecionada. A aprovação cabe ao síndico."
}

export function getCotacaoReadinessLabel(
  status: CompraStatus,
  totalCotacoes: number,
  temCotacaoSelecionada: boolean,
): { label: string; className: string } | null {
  if (status !== "nova") return null
  if (totalCotacoes === 0) {
    return { label: "Sem cotações", className: "bg-gray-100 text-gray-500" }
  }
  if (!temCotacaoSelecionada) {
    return { label: "Sem vencedora", className: "bg-amber-100 text-amber-800" }
  }
  return { label: "Pronta para aprovar", className: "bg-emerald-100 text-emerald-700" }
}

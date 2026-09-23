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

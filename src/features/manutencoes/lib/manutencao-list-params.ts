import {
  SOLICITACAO_TIPO_LABEL,
  SITUACAO_ORCAMENTO_LABEL,
  type SituacaoOrcamento,
  type SolicitacaoStatus,
  type SolicitacaoTipoServico,
} from "../types/solicitacao-manutencao.types"

const STATUS: SolicitacaoStatus[] = ["nova", "em_andamento", "finalizada", "cancelada"]
const TIPOS = Object.keys(SOLICITACAO_TIPO_LABEL) as SolicitacaoTipoServico[]
const SITUACOES = Object.keys(SITUACAO_ORCAMENTO_LABEL) as SituacaoOrcamento[]

export const FILTROS_FILA = ["pendentes", ...SITUACOES, "todas"] as const
export type FiltroFila = (typeof FILTROS_FILA)[number]

export interface ManutencaoListParams {
  visao: "chamados" | "orcamentos"
  status: SolicitacaoStatus | "todas"
  tipoServico: SolicitacaoTipoServico | ""
  situacaoOrcamento: SituacaoOrcamento | ""
  fila: FiltroFila
  search: string
  page: number
}

function readPage(value: string | null): number {
  if (!value) return 1
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

function isFiltroFila(value: string | null): value is FiltroFila {
  return !!value && (FILTROS_FILA as readonly string[]).includes(value)
}

export function readManutencaoListParams(params: URLSearchParams): ManutencaoListParams {
  const statusRaw = params.get("status")
  const tipoRaw = params.get("tipoServico")
  const situacaoRaw = params.get("situacaoOrcamento")
  const filaRaw = params.get("fila")

  return {
    visao: params.get("visao") === "orcamentos" ? "orcamentos" : "chamados",
    status: STATUS.includes(statusRaw as SolicitacaoStatus) ? (statusRaw as SolicitacaoStatus) : "todas",
    tipoServico: TIPOS.includes(tipoRaw as SolicitacaoTipoServico) ? (tipoRaw as SolicitacaoTipoServico) : "",
    situacaoOrcamento: SITUACOES.includes(situacaoRaw as SituacaoOrcamento)
      ? (situacaoRaw as SituacaoOrcamento)
      : "",
    fila: isFiltroFila(filaRaw) ? filaRaw : "pendentes",
    search: params.get("search") ?? "",
    page: readPage(params.get("page")),
  }
}

export function writeManutencaoListParams(state: ManutencaoListParams): URLSearchParams {
  const next = new URLSearchParams()
  if (state.visao === "orcamentos") {
    next.set("visao", "orcamentos")
    if (state.fila !== "pendentes") next.set("fila", state.fila)
  } else {
    if (state.status !== "todas") next.set("status", state.status)
    if (state.tipoServico) next.set("tipoServico", state.tipoServico)
    if (state.situacaoOrcamento) next.set("situacaoOrcamento", state.situacaoOrcamento)
  }
  if (state.search.trim()) next.set("search", state.search)
  if (state.page > 1) next.set("page", String(state.page))
  return next
}

export function manutencaoDetalheTo(id: string, state: ManutencaoListParams): string {
  const query = writeManutencaoListParams(state).toString()
  return query ? `/manutencoes/${id}?${query}` : `/manutencoes/${id}`
}

export function manutencaoListaFromDetalhe(params: URLSearchParams): string {
  const normalized = new URLSearchParams(params)
  if (normalized.get("visao") !== "orcamentos" && normalized.get("origem") === "orcamentos") {
    normalized.set("visao", "orcamentos")
  }
  normalized.delete("origem")
  const query = writeManutencaoListParams(readManutencaoListParams(normalized)).toString()
  return query ? `/manutencoes?${query}` : "/manutencoes"
}

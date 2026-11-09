import { DEFAULT_PAGE_SIZE, readPageSize, type PageSizeOption } from "@/lib/pagination"
import {
  COMPRA_CATEGORIA_LABEL,
  SITUACAO_COTACAO_LABEL,
  type CompraCategoria,
  type CompraStatus,
  type SituacaoCotacao,
} from "../types/compra.types"

const STATUS: CompraStatus[] = ["nova", "em_andamento", "finalizada", "cancelada"]
const CATEGORIAS = Object.keys(COMPRA_CATEGORIA_LABEL) as CompraCategoria[]
const SITUACOES = Object.keys(SITUACAO_COTACAO_LABEL) as SituacaoCotacao[]
const SORTS = ["condominio", "status", "itens", "solicitante", "tipoAprovacao", "cotacoes", "data"]

export interface CompraListParams {
  status: CompraStatus | "todas"
  categoria: CompraCategoria | "todas"
  situacaoCotacao: SituacaoCotacao | ""
  search: string
  page: number
  pageSize: PageSizeOption
  sort?: string
  dir?: "asc" | "desc"
}

function readPage(value: string | null): number {
  if (!value) return 1
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

export function readCompraListParams(params: URLSearchParams): CompraListParams {
  const statusRaw = params.get("status")
  const categoriaRaw = params.get("categoria")
  const situacaoRaw = params.get("situacaoCotacao")
  const situacaoCotacao = SITUACOES.includes(situacaoRaw as SituacaoCotacao)
    ? (situacaoRaw as SituacaoCotacao)
    : ""

  return {
    status: situacaoCotacao
      ? "nova"
      : STATUS.includes(statusRaw as CompraStatus)
        ? (statusRaw as CompraStatus)
        : "todas",
    categoria: CATEGORIAS.includes(categoriaRaw as CompraCategoria)
      ? (categoriaRaw as CompraCategoria)
      : "todas",
    situacaoCotacao,
    search: params.get("search") ?? "",
    page: readPage(params.get("page")),
    pageSize: readPageSize(params.get("pageSize")),
    ...readSort(params.get("sort"), params.get("dir")),
  }
}

function readSort(sort: string | null, dir: string | null): { sort?: string; dir?: "asc" | "desc" } {
  if (!sort || !SORTS.includes(sort)) return {}
  if (dir !== "asc" && dir !== "desc") return {}
  return { sort, dir }
}

export function writeCompraListParams(state: CompraListParams): URLSearchParams {
  const next = new URLSearchParams()
  if (state.situacaoCotacao) {
    next.set("status", "nova")
    next.set("situacaoCotacao", state.situacaoCotacao)
  } else if (state.status !== "todas") {
    next.set("status", state.status)
  }
  if (state.categoria !== "todas") next.set("categoria", state.categoria)
  if (state.search.trim()) next.set("search", state.search)
  if (state.sort && state.dir) {
    next.set("sort", state.sort)
    next.set("dir", state.dir)
  }
  if (state.page > 1) next.set("page", String(state.page))
  if (state.pageSize !== DEFAULT_PAGE_SIZE) next.set("pageSize", String(state.pageSize))
  return next
}

export function compraDetalheTo(id: string, params: URLSearchParams): string {
  const query = writeCompraListParams(readCompraListParams(params)).toString()
  return query ? `/compras/${id}?${query}` : `/compras/${id}`
}

export function compraListaFromDetalhe(params: URLSearchParams): string {
  const query = writeCompraListParams(readCompraListParams(params)).toString()
  return query ? `/compras?${query}` : "/compras"
}

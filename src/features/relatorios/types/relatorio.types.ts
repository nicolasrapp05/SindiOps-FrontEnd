export type RelatorioTipo =
  | "ocorrencias"
  | "mapa_cotacoes"
  | "lista_compras"
  | "agenda_prazos"
  | "agenda_mandatos"
  | "manutencoes"
export type RelatorioFormato = "pdf" | "excel" | "word"

export const RELATORIO_TIPO_LABEL: Record<RelatorioTipo, string> = {
  ocorrencias: "Ocorrências",
  mapa_cotacoes: "Mapa de Cotações",
  lista_compras: "Lista de Compras",
  agenda_prazos: "Agenda de Prazos",
  agenda_mandatos: "Agenda de Mandatos",
  manutencoes: "Manutenções",
}

export interface GerarRelatorioRequest {
  tipo: RelatorioTipo
  condominioId: string
  formato: RelatorioFormato
  filtros?: Record<string, string>
}

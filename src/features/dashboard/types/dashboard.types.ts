export interface DashboardAlertas {
  manutencoesVencidas?: number | null
  manutencoesProximas?: number | null
  ocorrenciasAbertas?: number | null
  comprasPendentes?: number | null
  contratosVencendo?: number | null
}

export interface AgendaItem {
  tipo: "manutencao_obrigatoria" | "contrato" | "mandato"
  descricao: string
  dataVencimento: string
  status: string
  condominioId: string
  condominioNome: string
  referenciaId: string
}

export interface DashboardData {
  alertas: DashboardAlertas
  agenda: AgendaItem[]
}

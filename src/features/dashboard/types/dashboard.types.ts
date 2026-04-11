export interface DashboardAlertas {
  manutencoesVencidas: number
  manutencoesProximas: number
  ocorrenciasAbertas: number
  comprasPendentes: number
  contratosVencendo: number
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

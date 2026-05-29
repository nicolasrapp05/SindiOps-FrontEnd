import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SolicitacaoStatus } from "../types/solicitacao-manutencao.types"

const STYLE: Record<SolicitacaoStatus, string> = {
  nova: "bg-blue-100 text-blue-700 border-transparent",
  em_andamento: "bg-amber-100 text-amber-700 border-transparent",
  finalizada: "bg-emerald-100 text-emerald-700 border-transparent",
  cancelada: "bg-red-100 text-red-700 border-transparent",
}

const LABEL: Record<SolicitacaoStatus, string> = {
  nova: "Nova",
  em_andamento: "Em Andamento",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
}

interface SolicitacaoStatusBadgeProps {
  status: SolicitacaoStatus
}

export function SolicitacaoStatusBadge({ status }: SolicitacaoStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLE[status])}>
      {LABEL[status]}
    </Badge>
  )
}

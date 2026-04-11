import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ManutencaoStatus } from "../types/manutencao-obrigatoria.types"

const STYLE: Record<ManutencaoStatus, string> = {
  ok: "bg-emerald-100 text-emerald-700 border-transparent",
  upcoming: "bg-orange-100 text-orange-700 border-transparent",
  overdue: "bg-red-100 text-red-700 border-transparent",
}

const LABEL: Record<ManutencaoStatus, string> = {
  ok: "OK",
  upcoming: "Próxima",
  overdue: "Vencida",
}

interface ManutencaoStatusBadgeProps {
  status: ManutencaoStatus
}

export function ManutencaoStatusBadge({ status }: ManutencaoStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLE[status])}>
      {LABEL[status]}
    </Badge>
  )
}

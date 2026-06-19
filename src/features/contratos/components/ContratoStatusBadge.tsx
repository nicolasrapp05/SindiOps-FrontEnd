import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CONTRATO_STATUS_LABEL } from "../lib/contrato-status"
import type { ContratoStatus } from "../types/contrato.types"

const STATUS_CLASS: Record<ContratoStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  expiring: "bg-orange-100 text-orange-700",
  expired: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
}

interface ContratoStatusBadgeProps {
  status: ContratoStatus
}

export default function ContratoStatusBadge({ status }: ContratoStatusBadgeProps) {
  return (
    <Badge className={cn("border-0 font-medium", STATUS_CLASS[status])}>
      {CONTRATO_STATUS_LABEL[status]}
    </Badge>
  )
}

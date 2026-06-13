import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ContratoStatus } from "../types/contrato.types"

const STATUS_MAP: Record<
  ContratoStatus,
  { label: string; className: string }
> = {
  active: { label: "Vigente", className: "bg-emerald-100 text-emerald-700" },
  expiring: { label: "Expirando", className: "bg-orange-100 text-orange-700" },
  expired: { label: "Expirado", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelado", className: "bg-gray-100 text-gray-600" },
}

interface ContratoStatusBadgeProps {
  status: ContratoStatus
}

export default function ContratoStatusBadge({ status }: ContratoStatusBadgeProps) {
  const cfg = STATUS_MAP[status]
  return (
    <Badge className={cn("border-0 font-medium", cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

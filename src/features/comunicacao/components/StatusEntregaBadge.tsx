import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { StatusEntrega } from "../types/email-log.types"

const STYLE: Record<StatusEntrega, string> = {
  sent: "bg-gray-100 text-gray-600 border-transparent",
  delivered: "bg-emerald-100 text-emerald-700 border-transparent",
  failed: "bg-red-100 text-red-700 border-transparent",
}

const LABEL: Record<StatusEntrega, string> = {
  sent: "Enviado",
  delivered: "Entregue",
  failed: "Falhou",
}

interface StatusEntregaBadgeProps {
  status: StatusEntrega
}

export function StatusEntregaBadge({ status }: StatusEntregaBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLE[status])}>
      {LABEL[status]}
    </Badge>
  )
}

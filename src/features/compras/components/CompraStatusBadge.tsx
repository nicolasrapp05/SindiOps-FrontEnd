import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CompraStatus } from "../types/compra.types"

const STATUS_CONFIG: Record<
  CompraStatus,
  { label: string; className: string }
> = {
  nova: {
    label: "Nova",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  em_andamento: {
    label: "Em Andamento",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  },
  finalizada: {
    label: "Finalizada",
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  },
}

export default function CompraStatusBadge({ status }: { status: CompraStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge variant="secondary" className={cn("font-medium", cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

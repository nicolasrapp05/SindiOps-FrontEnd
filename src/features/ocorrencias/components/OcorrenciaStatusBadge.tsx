import { Badge } from "@/components/ui/badge"
import type { OcorrenciaStatus } from "../types/ocorrencia.types"

const CONFIG: Record<OcorrenciaStatus, { label: string; className: string }> = {
  nova: { label: "Nova", className: "bg-blue-100 text-blue-700" },
  em_andamento: { label: "Em Andamento", className: "bg-amber-100 text-amber-700" },
  finalizada: { label: "Finalizada", className: "bg-emerald-100 text-emerald-700" },
  cancelada: { label: "Cancelada", className: "bg-gray-100 text-gray-600" },
}

export default function OcorrenciaStatusBadge({ status }: { status: OcorrenciaStatus }) {
  const c = CONFIG[status]
  return <Badge className={c.className}>{c.label}</Badge>
}

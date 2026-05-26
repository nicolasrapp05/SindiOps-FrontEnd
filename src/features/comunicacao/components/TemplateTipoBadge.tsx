import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TEMPLATE_TIPO_LABEL, type TemplateTipo } from "../types/template.types"

const TIPO_STYLES: Record<TemplateTipo, string> = {
  advertencia: "bg-amber-100 text-amber-700 border-transparent",
  multa: "bg-red-100 text-red-700 border-transparent",
  notificacao_ocorrencia: "bg-blue-100 text-blue-700 border-transparent",
  comunicado_geral: "bg-purple-100 text-purple-700 border-transparent",
  notificacao_manutencao: "bg-orange-100 text-orange-700 border-transparent",
}

interface TemplateTipoBadgeProps {
  tipo: TemplateTipo
}

export function TemplateTipoBadge({ tipo }: TemplateTipoBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium", TIPO_STYLES[tipo])}>
      {TEMPLATE_TIPO_LABEL[tipo]}
    </Badge>
  )
}

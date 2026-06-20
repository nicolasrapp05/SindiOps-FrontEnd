import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type FuncionarioStatusBadgeProps = {
  ativo: boolean
  convitePendente?: boolean
}

export default function FuncionarioStatusBadge({
  ativo,
  convitePendente,
}: FuncionarioStatusBadgeProps) {
  if (!ativo) {
    return (
      <Badge
        variant="secondary"
        className={cn("font-medium bg-red-100 text-red-700 hover:bg-red-100")}
      >
        Inativo
      </Badge>
    )
  }

  if (convitePendente) {
    return (
      <Badge
        variant="secondary"
        className={cn("font-medium bg-amber-100 text-amber-800 hover:bg-amber-100")}
      >
        Pendente
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      className={cn("font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-100")}
    >
      Ativo
    </Badge>
  )
}

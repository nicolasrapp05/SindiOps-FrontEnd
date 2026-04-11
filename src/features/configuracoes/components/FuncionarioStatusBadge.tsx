import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function FuncionarioStatusBadge({ ativo }: { ativo: boolean }) {
  if (ativo) {
    return (
      <Badge
        variant="secondary"
        className={cn("font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-100")}
      >
        Ativo
      </Badge>
    )
  }
  return (
    <Badge
      variant="secondary"
      className={cn("font-medium bg-gray-100 text-gray-600 hover:bg-gray-100")}
    >
      Inativo
    </Badge>
  )
}

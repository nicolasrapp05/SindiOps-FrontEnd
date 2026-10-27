import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  SITUACAO_ORCAMENTO_LABEL,
  type SituacaoOrcamento,
} from "../types/solicitacao-manutencao.types"

const STYLE: Record<SituacaoOrcamento, string> = {
  sem_orcamento: "bg-gray-100 text-gray-600 border-transparent",
  aguardando_proposta: "bg-amber-100 text-amber-800 border-transparent",
  proposta_selecionada: "bg-blue-100 text-blue-700 border-transparent",
  aprovado: "bg-emerald-100 text-emerald-700 border-transparent",
  encerrado: "bg-gray-100 text-gray-500 border-transparent",
}

interface SituacaoOrcamentoBadgeProps {
  situacao: SituacaoOrcamento
}

export function SituacaoOrcamentoBadge({ situacao }: SituacaoOrcamentoBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLE[situacao])}>
      {SITUACAO_ORCAMENTO_LABEL[situacao]}
    </Badge>
  )
}

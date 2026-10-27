import { formatBRL } from "@/lib/currency"
import type { OrcamentoManutencao } from "../types/orcamento-manutencao.types"
import type { SituacaoOrcamento, SolicitacaoStatus } from "../types/solicitacao-manutencao.types"
import type { UserCargo } from "@/types"

export function getMenorValor(orcamentos: Pick<OrcamentoManutencao, "valor">[]): number | null {
  if (orcamentos.length === 0) return null
  return Math.min(...orcamentos.map((o) => o.valor))
}

export function getMenorPrazo(
  orcamentos: Pick<OrcamentoManutencao, "prazoExecucaoDias">[],
): number | null {
  const prazos = orcamentos
    .map((o) => o.prazoExecucaoDias)
    .filter((prazo): prazo is number => typeof prazo === "number" && prazo > 0)
  if (prazos.length === 0) return null
  return Math.min(...prazos)
}

export function diferencaParaMenor(valor: number, menor: number | null) {
  if (menor == null || valor <= menor) return 0
  return Math.round((valor - menor) * 100) / 100
}

export function podeEditarOrcamentos(
  status: SolicitacaoStatus,
  orcamentoAprovado: boolean,
  cargo: UserCargo | null | undefined,
) {
  const admin = cargo === "sindico" || cargo === "secretario"
  const aberto = status === "nova" || status === "em_andamento"
  return admin && aberto && !orcamentoAprovado
}

export function textoProximaAcao(input: {
  situacao: SituacaoOrcamento
  status: SolicitacaoStatus
  cargo: UserCargo | null | undefined
  aprovadoPor?: string
}) {
  const admin = input.cargo === "sindico" || input.cargo === "secretario"
  const sindico = input.cargo === "sindico"

  if (!admin) {
    switch (input.situacao) {
      case "sem_orcamento":
        return "Nenhum orçamento registrado para este chamado."
      case "aguardando_proposta":
        return "Há propostas em análise pela administração."
      case "proposta_selecionada":
        return "Uma proposta foi escolhida e aguarda a aprovação do síndico."
      case "aprovado":
        return input.aprovadoPor
          ? `Orçamento aprovado por ${input.aprovadoPor}.`
          : "Orçamento aprovado."
      case "encerrado":
        return "O processo de orçamento deste chamado está encerrado."
    }
  }

  if (input.status === "finalizada") return "Chamado concluído. Os orçamentos ficam apenas para consulta."
  if (input.status === "cancelada") return "Chamado cancelado. Os orçamentos ficam bloqueados."
  if (input.situacao === "sem_orcamento") return "Registre a primeira proposta para comparar prestadores."
  if (input.situacao === "aguardando_proposta") return "Compare valor, prazo e condições e selecione uma proposta."
  if (input.situacao === "proposta_selecionada") {
    return sindico
      ? "Aprove a proposta selecionada para travar o mapa e seguir com a execução."
      : "Proposta selecionada. A aprovação cabe ao síndico."
  }
  if (input.situacao === "aprovado") {
    return input.aprovadoPor
      ? `Aprovado por ${input.aprovadoPor}. A execução segue no status do chamado.`
      : "Orçamento aprovado. A execução segue no status do chamado."
  }
  return "Acompanhe as propostas deste chamado."
}

export function formatarPrazo(dias?: number) {
  if (!dias) return "Prazo não informado"
  return dias === 1 ? "1 dia" : `${dias} dias`
}

export function formatarValidade(iso?: string) {
  if (!iso) return "Sem validade"
  const data = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(data.getTime())) return iso
  return data.toLocaleDateString("pt-BR")
}

export { formatBRL as brl }

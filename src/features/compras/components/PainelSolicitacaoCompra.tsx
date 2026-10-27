import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import ConfirmDialog from "@/components/shared/ConfirmDialog"
import { formatBRL } from "@/lib/currency"
import {
  useCreateCotacao,
  useDeleteCotacao,
  useSelecionarCotacao,
  useUpdateCotacao,
} from "../hooks/useCompras"
import {
  canManageCotacoes,
  getAprovarBlockReason,
  resumoItensCompra,
} from "../lib/compra-flow"
import type {
  Cotacao,
  CreateCotacaoRequest,
  SolicitacaoCompra,
  SolicitacaoCompraItem,
  TipoAprovacao,
} from "../types/compra.types"
import CotacaoForm from "./CotacaoForm"
import ItensSolicitacaoLista from "./ItensSolicitacaoLista"
import MapaCotacoes from "./MapaCotacoes"

interface CotacaoFormState {
  itens: SolicitacaoCompraItem[]
  cotacao?: Cotacao
}

interface PainelSolicitacaoCompraProps {
  row: SolicitacaoCompra
  detail?: SolicitacaoCompra
  detailLoading: boolean
  sindico: boolean
  statusPending: boolean
  aprovarPending: boolean
  onAprovar: (state: { id: string; tipoAprovacao: TipoAprovacao; valorTotal?: number }) => void
  onCancelar: (state: { id: string; nome: string }) => void
  onReativar: (id: string) => void
  onFinalizar: (id: string) => void
}

export default function PainelSolicitacaoCompra({
  row,
  detail,
  detailLoading,
  sindico,
  statusPending,
  aprovarPending,
  onAprovar,
  onCancelar,
  onReativar,
  onFinalizar,
}: PainelSolicitacaoCompraProps) {
  const selecionarMutation = useSelecionarCotacao()
  const createCotacaoMutation = useCreateCotacao()
  const updateCotacaoMutation = useUpdateCotacao()
  const deleteCotacaoMutation = useDeleteCotacao()
  const [cotacaoFormState, setCotacaoFormState] = useState<CotacaoFormState | null>(null)
  const [cotacaoParaExcluir, setCotacaoParaExcluir] = useState<{
    cotacaoId: string
    nome: string
  } | null>(null)

  if (detailLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />
  }

  const itens = detail?.itens ?? row.itens
  const cotacoes = detail?.cotacoes ?? row.cotacoes ?? []
  const podeGerenciar = canManageCotacoes(row.status)
  const temCotacaoSelecionada =
    detail?.temCotacaoSelecionada ??
    row.temCotacaoSelecionada ??
    cotacoes.some((cotacao) => cotacao.selecionada)
  const cotacaoSelecionada = cotacoes.find((cotacao) => cotacao.selecionada)
  const totalCotacoes = detail ? cotacoes.length : row.totalCotacoes
  const aprovarBlockReason = getAprovarBlockReason(row.status, totalCotacoes, temCotacaoSelecionada)
  const itensResumo = resumoItensCompra(itens)

  const closeForm = () => setCotacaoFormState(null)

  const handleFormSubmit = (data: CreateCotacaoRequest) => {
    if (!cotacaoFormState) return
    const { cotacao } = cotacaoFormState
    if (cotacao) {
      updateCotacaoMutation.mutate(
        { solicitacaoId: row.id, cotacaoId: cotacao.id, data },
        { onSuccess: closeForm },
      )
      return
    }
    createCotacaoMutation.mutate(
      { solicitacaoId: row.id, data },
      { onSuccess: closeForm },
    )
  }

  return (
    <div className="space-y-4">
      <ItensSolicitacaoLista itens={itens} justificativa={detail?.justificativa ?? row.justificativa} />

      {!podeGerenciar && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          Cotações bloqueadas - solicitação já aprovada, finalizada ou cancelada.
        </div>
      )}

      <p className="text-sm font-medium text-muted-foreground">Mapa de cotações</p>
      <MapaCotacoes
        cotacoes={cotacoes}
        itens={itens}
        {...(podeGerenciar
          ? {
              isSelecting: selecionarMutation.isPending,
              onSelecionar: (cotacaoId: string) =>
                selecionarMutation.mutate({ solicitacaoId: row.id, cotacaoId }),
              onEdit: (cotacao: Cotacao) => setCotacaoFormState({ itens, cotacao }),
              onDelete: (cotacaoId: string) => {
                const cotacao = cotacoes.find((item) => item.id === cotacaoId)
                setCotacaoParaExcluir({
                  cotacaoId,
                  nome: cotacao?.nomeEmpresa ?? cotacao?.fornecedor?.nome ?? "esta cotação",
                })
              },
              isDeleting: deleteCotacaoMutation.isPending,
            }
          : {})}
      />

      {(podeGerenciar || (sindico && row.status !== "finalizada")) && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
          {podeGerenciar && (
            <Button size="sm" onClick={() => setCotacaoFormState({ itens })}>
              <Plus className="mr-1.5 h-4 w-4" />
              Adicionar cotação
            </Button>
          )}
          {sindico && row.status === "cancelada" && (
            <Button
              variant="outline"
              size="sm"
              disabled={statusPending}
              onClick={() => onReativar(row.id)}
            >
              Reativar Solicitação
            </Button>
          )}
          {sindico && (row.status === "nova" || row.status === "em_andamento") && (
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              size="sm"
              disabled={statusPending}
              onClick={() => onCancelar({ id: row.id, nome: itensResumo.descricao })}
            >
              Cancelar Solicitação
            </Button>
          )}
          {sindico && row.status === "nova" && (
            <AprovarCompraButton
              label={
                cotacaoSelecionada
                  ? `Aprovar Compra (${formatBRL(cotacaoSelecionada.valorTotal)})`
                  : "Aprovar Compra"
              }
              blocked={aprovarBlockReason !== null}
              reason={aprovarBlockReason}
              pending={aprovarPending}
              onClick={() =>
                onAprovar({
                  id: row.id,
                  tipoAprovacao: row.tipoAprovacao,
                  valorTotal: cotacaoSelecionada?.valorTotal,
                })
              }
            />
          )}
          {sindico && row.status === "em_andamento" && (
            <Button size="sm" disabled={statusPending} onClick={() => onFinalizar(row.id)}>
              Finalizar Compra
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={cotacaoParaExcluir !== null}
        onOpenChange={(open) => { if (!open) setCotacaoParaExcluir(null) }}
        title="Excluir cotação"
        description={`Tem certeza que deseja excluir a cotação de "${cotacaoParaExcluir?.nome ?? "esta cotação"}"?`}
        confirmLabel="Excluir"
        isPending={deleteCotacaoMutation.isPending}
        onConfirm={() => {
          if (!cotacaoParaExcluir) return
          deleteCotacaoMutation.mutate(
            { solicitacaoId: row.id, cotacaoId: cotacaoParaExcluir.cotacaoId },
            { onSuccess: () => setCotacaoParaExcluir(null) },
          )
        }}
      />

      <CotacaoForm
        open={cotacaoFormState !== null}
        onOpenChange={(open) => { if (!open) closeForm() }}
        cotacao={cotacaoFormState?.cotacao}
        itensSolicitacao={cotacaoFormState?.itens ?? []}
        isSubmitting={createCotacaoMutation.isPending || updateCotacaoMutation.isPending}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}

function AprovarCompraButton({
  label,
  blocked,
  reason,
  pending,
  onClick,
}: {
  label: string
  blocked: boolean
  reason: string | null
  pending: boolean
  onClick: () => void
}) {
  const button = (
    <Button size="sm" disabled={pending || blocked} onClick={onClick}>
      {label}
    </Button>
  )
  if (!blocked || !reason) return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex">
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px]">
        {reason}
      </TooltipContent>
    </Tooltip>
  )
}

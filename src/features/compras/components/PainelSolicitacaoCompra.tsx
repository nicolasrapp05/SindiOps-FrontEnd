import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCargoLabel } from "@/types"
import { cn } from "@/lib/utils"
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
  getCotacaoReadinessLabel,
  resumoItensCompra,
  textoProximaAcaoCompra,
} from "../lib/compra-flow"
import type {
  Cotacao,
  CreateCotacaoRequest,
  SolicitacaoCompra,
  SolicitacaoCompraItem,
  TipoAprovacao,
} from "../types/compra.types"
import CompraStatusBadge from "./CompraStatusBadge"
import CotacaoForm from "./CotacaoForm"
import ItensSolicitacaoLista from "./ItensSolicitacaoLista"
import MapaCotacoes from "./MapaCotacoes"

interface CotacaoFormState {
  itens: SolicitacaoCompraItem[]
  cotacao?: Cotacao
}

const TIPO_APROVACAO_LABEL: Record<TipoAprovacao, string> = {
  sindico: "Síndico",
  conselho: "Conselho",
  assembleia: "Assembleia",
}

interface PainelSolicitacaoCompraProps {
  solicitacao: SolicitacaoCompra
  sindico: boolean
  statusPending: boolean
  aprovarPending: boolean
  voltarPara: string
  onAprovar: (state: { id: string; tipoAprovacao: TipoAprovacao; valorTotal?: number }) => void
  onCancelar: (state: { id: string; nome: string }) => void
  onReativar: (id: string) => void
  onFinalizar: (id: string) => void
}

export default function PainelSolicitacaoCompra({
  solicitacao,
  sindico,
  statusPending,
  aprovarPending,
  voltarPara,
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

  const itens = solicitacao.itens
  const cotacoes = solicitacao.cotacoes ?? []
  const podeGerenciar = canManageCotacoes(solicitacao.status)
  const temCotacaoSelecionada =
    solicitacao.temCotacaoSelecionada ?? cotacoes.some((cotacao) => cotacao.selecionada)
  const cotacaoSelecionada = cotacoes.find((cotacao) => cotacao.selecionada)
  const totalCotacoes = cotacoes.length
  const aprovarBlockReason = getAprovarBlockReason(solicitacao.status, totalCotacoes, temCotacaoSelecionada)
  const itensResumo = resumoItensCompra(itens)
  const readiness = getCotacaoReadinessLabel(solicitacao.status, totalCotacoes, temCotacaoSelecionada)
  const subtitulo = [itensResumo.categoria, itensResumo.quantidade].filter((parte) => parte !== "—").join(" · ")
  const proxima = textoProximaAcaoCompra({
    status: solicitacao.status,
    totalCotacoes,
    temCotacaoSelecionada,
    sindico,
    aprovadoPor: solicitacao.aprovadoPor?.nome,
  })

  const closeForm = () => setCotacaoFormState(null)

  const handleFormSubmit = (data: CreateCotacaoRequest) => {
    if (!cotacaoFormState) return
    const { cotacao } = cotacaoFormState
    if (cotacao) {
      updateCotacaoMutation.mutate(
        { solicitacaoId: solicitacao.id, cotacaoId: cotacao.id, data },
        { onSuccess: closeForm },
      )
      return
    }
    createCotacaoMutation.mutate(
      { solicitacaoId: solicitacao.id, data },
      { onSuccess: closeForm },
    )
  }

  const cargoSolicitante = formatCargoLabel(solicitacao.solicitadoPor.cargo)

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" className="-ml-2 px-2" asChild>
          <Link to={voltarPara}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Compras
          </Link>
        </Button>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground" title={itensResumo.titulo}>
              {itensResumo.descricao}
            </h1>
            {subtitulo && <p className="mt-1 text-sm text-gray-500">{subtitulo}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <CompraStatusBadge status={solicitacao.status} />
              {readiness && (
                <Badge variant="outline" className={cn("border-transparent font-medium", readiness.className)}>
                  {readiness.label}
                </Badge>
              )}
            </div>
          </div>
          {podeGerenciar && (
            <Button className="shrink-0" onClick={() => setCotacaoFormState({ itens })}>
              <Plus className="mr-1.5 h-4 w-4" />
              Adicionar cotação
            </Button>
          )}
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="text-sm font-medium text-foreground">Solicitação</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <Info termo="Solicitante" valor={solicitacao.solicitadoPor.nome} />
            {cargoSolicitante ? <Info termo="Cargo" valor={cargoSolicitante} /> : null}
            <Info termo="Tipo de aprovação" valor={TIPO_APROVACAO_LABEL[solicitacao.tipoAprovacao]} badge />
            <Info termo="Cotações" valor={String(totalCotacoes)} />
          </dl>
          <ItensSolicitacaoLista itens={itens} justificativa={solicitacao.justificativa} />
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="text-sm font-medium text-foreground">Próxima ação</h2>
          <p className="mt-2 text-sm text-muted-foreground">{proxima}</p>
          {sindico && solicitacao.status !== "finalizada" && (
            <div className="mt-4 flex flex-col gap-2">
              {solicitacao.status === "nova" && (
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
                      id: solicitacao.id,
                      tipoAprovacao: solicitacao.tipoAprovacao,
                      valorTotal: cotacaoSelecionada?.valorTotal,
                    })
                  }
                />
              )}
              {solicitacao.status === "em_andamento" && (
                <Button disabled={statusPending} onClick={() => onFinalizar(solicitacao.id)}>
                  Finalizar Compra
                </Button>
              )}
              {solicitacao.status === "cancelada" && (
                <Button
                  variant="outline"
                  disabled={statusPending}
                  onClick={() => onReativar(solicitacao.id)}
                >
                  Reativar Solicitação
                </Button>
              )}
              {(solicitacao.status === "nova" || solicitacao.status === "em_andamento") && (
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  disabled={statusPending}
                  onClick={() => onCancelar({ id: solicitacao.id, nome: itensResumo.descricao })}
                >
                  Cancelar Solicitação
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Cotações</h2>
        {!podeGerenciar && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            Cotações bloqueadas - solicitação já aprovada, finalizada ou cancelada.
          </div>
        )}
        <MapaCotacoes
          cotacoes={cotacoes}
          itens={itens}
          {...(podeGerenciar
            ? {
                isSelecting: selecionarMutation.isPending,
                onSelecionar: (cotacaoId: string) =>
                  selecionarMutation.mutate({ solicitacaoId: solicitacao.id, cotacaoId }),
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
      </section>

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
            { solicitacaoId: solicitacao.id, cotacaoId: cotacaoParaExcluir.cotacaoId },
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
    <Button disabled={pending || blocked} onClick={onClick}>
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

function Info({ termo, valor, badge = false }: { termo: string; valor: string; badge?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{termo}</dt>
      <dd className="mt-0.5 text-foreground">
        {badge ? <Badge variant="secondary" className="font-normal">{valor}</Badge> : valor}
      </dd>
    </div>
  )
}

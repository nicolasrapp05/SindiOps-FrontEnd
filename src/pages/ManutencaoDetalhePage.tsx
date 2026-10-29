import { useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, Hammer, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import ConfirmDialog from "@/components/shared/ConfirmDialog"
import { useAuthStore } from "@/store/auth-store"
import { canAccessAdmin } from "@/lib/cargo-permissions"
import AcoesStatusChamado from "@/features/manutencoes/components/AcoesStatusChamado"
import { isStatusFinal } from "@/lib/status-transitions"
import { SolicitacaoStatusBadge } from "@/features/manutencoes/components/SolicitacaoStatusBadge"
import { SituacaoOrcamentoBadge } from "@/features/manutencoes/components/SituacaoOrcamentoBadge"
import MapaOrcamentos from "@/features/manutencoes/components/MapaOrcamentos"
import OrcamentoForm from "@/features/manutencoes/components/OrcamentoForm"
import AprovarOrcamentoDialog from "@/features/manutencoes/components/AprovarOrcamentoDialog"
import { useSolicitacaoManutencao, useUpdateSolicitacaoStatus } from "@/features/manutencoes/hooks/useSolicitacoesManutencao"
import {
  useAprovarOrcamentoManutencao,
  useCreateOrcamentoManutencao,
  useDeleteOrcamentoManutencao,
  useOrcamentosManutencao,
  useReabrirOrcamentoManutencao,
  useSelecionarOrcamentoManutencao,
  useUpdateOrcamentoManutencao,
} from "@/features/manutencoes/hooks/useOrcamentosManutencao"
import { manutencaoListaFromDetalhe } from "@/features/manutencoes/lib/manutencao-list-params"
import { podeEditarOrcamentos, textoProximaAcao } from "@/features/manutencoes/lib/orcamento-flow"
import { nomeOrcamento, type OrcamentoManutencao } from "@/features/manutencoes/types/orcamento-manutencao.types"
import type { CreateOrcamentoManutencaoRequest } from "@/features/manutencoes/types/orcamento-manutencao.types"
import { SOLICITACAO_TIPO_LABEL } from "@/features/manutencoes/types/solicitacao-manutencao.types"

export default function ManutencaoDetalhePage() {
  const { id = "" } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const cargo = useAuthStore((s) => s.user?.cargo)
  const admin = canAccessAdmin(cargo)
  const sindico = cargo === "sindico"
  const voltarPara = manutencaoListaFromDetalhe(searchParams)

  const solicitacaoQuery = useSolicitacaoManutencao(id)
  const orcamentosQuery = useOrcamentosManutencao(id, admin)
  const statusMutation = useUpdateSolicitacaoStatus()
  const createMutation = useCreateOrcamentoManutencao(id)
  const updateMutation = useUpdateOrcamentoManutencao(id)
  const selectMutation = useSelecionarOrcamentoManutencao(id)
  const deleteMutation = useDeleteOrcamentoManutencao(id)
  const aprovarMutation = useAprovarOrcamentoManutencao(id)
  const reabrirMutation = useReabrirOrcamentoManutencao(id)

  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<OrcamentoManutencao | undefined>()
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const [aprovarOpen, setAprovarOpen] = useState(false)
  const [reabrirOpen, setReabrirOpen] = useState(false)

  const solicitacao = solicitacaoQuery.data
  const orcamentos = orcamentosQuery.data ?? []
  const selecionado = orcamentos.find((orcamento) => orcamento.selecionada)

  if (solicitacaoQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (solicitacaoQuery.isError || !solicitacao) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-red-50 p-4">
          <Hammer className="text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Não foi possível abrir a manutenção</h3>
        <p className="mt-1 text-sm text-gray-500">O chamado não existe ou você não tem acesso a ele.</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate(voltarPara)}>
          Voltar para manutenções
        </Button>
      </div>
    )
  }

  const editavel = podeEditarOrcamentos(solicitacao.status, solicitacao.orcamentoAprovado, cargo)
  const podeReabrir = sindico && solicitacao.orcamentoAprovado && solicitacao.status !== "finalizada"
  const podeAprovar = sindico && editavel && solicitacao.temOrcamentoSelecionado
  const proxima = textoProximaAcao({
    situacao: solicitacao.situacaoOrcamento,
    status: solicitacao.status,
    cargo,
    aprovadoPor: solicitacao.orcamentoAprovadoPor?.nome,
  })
  const temAcaoStatus = !isStatusFinal(solicitacao.status)

  const salvar = (payload: CreateOrcamentoManutencaoRequest) => {
    if (editando) {
      updateMutation.mutate(
        { orcamentoId: editando.id, data: payload },
        { onSuccess: () => { setFormOpen(false); setEditando(undefined) } },
      )
      return
    }
    createMutation.mutate(payload, {
      onSuccess: () => setFormOpen(false),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" className="-ml-2 px-2" asChild>
          <Link to={voltarPara}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Manutenções
          </Link>
        </Button>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {SOLICITACAO_TIPO_LABEL[solicitacao.tipoServico]}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{solicitacao.local}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <SolicitacaoStatusBadge status={solicitacao.status} />
              <SituacaoOrcamentoBadge situacao={solicitacao.situacaoOrcamento} />
            </div>
          </div>
          {admin && editavel && (
            <Button
              className="shrink-0"
              onClick={() => {
                setEditando(undefined)
                setFormOpen(true)
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Novo orçamento
            </Button>
          )}
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="text-sm font-medium text-foreground">Chamado</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <Info termo="Responsável" valor={solicitacao.responsavel === "fornecedor" ? "Fornecedor" : "Zeladoria"} />
            <Info termo="Prestador" valor={solicitacao.fornecedor?.nome ?? "Não definido"} />
            <Info termo="Registrado por" valor={solicitacao.registradoPor?.nome ?? "—"} />
            <Info
              termo="Propostas"
              valor={String(solicitacao.totalOrcamentos ?? 0)}
            />
          </dl>
          {solicitacao.descricao && (
            <p className="mt-4 text-sm text-foreground">{solicitacao.descricao}</p>
          )}
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="text-sm font-medium text-foreground">Próxima ação</h2>
          <p className="mt-2 text-sm text-muted-foreground">{proxima}</p>
          {(podeAprovar || podeReabrir || temAcaoStatus) && (
            <div className="mt-4 flex flex-col gap-2">
              {podeAprovar && (
                <Button onClick={() => setAprovarOpen(true)} disabled={aprovarMutation.isPending}>
                  Aprovar proposta
                </Button>
              )}
              {podeReabrir && (
                <Button variant="outline" onClick={() => setReabrirOpen(true)}>
                  Reabrir orçamento
                </Button>
              )}
              <AcoesStatusChamado
                status={solicitacao.status}
                pending={statusMutation.isPending}
                onChange={(status) =>
                  statusMutation.mutateAsync({
                    id: solicitacao.id,
                    status,
                    dataConclusao:
                      status === "finalizada" ? new Date().toISOString().slice(0, 10) : undefined,
                  })
                }
              />
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Orçamentos</h2>
          {admin && orcamentosQuery.isError && (
            <Button variant="outline" size="sm" onClick={() => orcamentosQuery.refetch()}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Tentar novamente
            </Button>
          )}
        </div>

        {!admin && (
          <div className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
            Os valores e as condições das propostas ficam disponíveis para o síndico e a secretaria.
            {solicitacao.totalOrcamentos > 0
              ? ` Há ${solicitacao.totalOrcamentos} proposta${solicitacao.totalOrcamentos === 1 ? "" : "s"} registrada${solicitacao.totalOrcamentos === 1 ? "" : "s"}.`
              : " Nenhuma proposta foi registrada."}
          </div>
        )}

        {admin && orcamentosQuery.isLoading && <Skeleton className="h-48 rounded-2xl" />}

        {admin && orcamentosQuery.isError && (
          <p className="text-sm text-red-600">Não foi possível carregar os orçamentos.</p>
        )}

        {admin && !orcamentosQuery.isLoading && !orcamentosQuery.isError && (
          <MapaOrcamentos
            orcamentos={orcamentos}
            onSelecionar={editavel ? (orcamentoId) => selectMutation.mutate(orcamentoId) : undefined}
            isSelecting={selectMutation.isPending}
            onEdit={
              editavel
                ? (orcamento) => {
                    setEditando(orcamento)
                    setFormOpen(true)
                  }
                : undefined
            }
            onDelete={editavel ? setExcluirId : undefined}
            isDeleting={deleteMutation.isPending}
          />
        )}

        {admin && solicitacao.orcamentoAprovado && (
          <p className="text-xs text-muted-foreground">
            Mapa bloqueado após a aprovação.
            {solicitacao.orcamentoAprovadoPor?.nome
              ? ` Aprovado por ${solicitacao.orcamentoAprovadoPor.nome}.`
              : ""}
          </p>
        )}
      </section>

      <OrcamentoForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditando(undefined)
        }}
        orcamento={editando}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={salvar}
      />

      <AprovarOrcamentoDialog
        open={aprovarOpen}
        onOpenChange={setAprovarOpen}
        prestador={selecionado ? nomeOrcamento(selecionado) : undefined}
        valor={selecionado?.valor}
        isPending={aprovarMutation.isPending}
        onConfirm={() =>
          aprovarMutation.mutate(undefined, { onSuccess: () => setAprovarOpen(false) })
        }
      />

      <ConfirmDialog
        open={reabrirOpen}
        onOpenChange={setReabrirOpen}
        title="Reabrir orçamento"
        description="As propostas voltam a poder ser editadas e selecionadas. O prestador já gravado no chamado permanece até uma nova aprovação."
        confirmLabel="Reabrir"
        isPending={reabrirMutation.isPending}
        onConfirm={() =>
          reabrirMutation.mutate(undefined, { onSuccess: () => setReabrirOpen(false) })
        }
      />

      <ConfirmDialog
        open={!!excluirId}
        onOpenChange={(open) => !open && setExcluirId(null)}
        title="Excluir orçamento"
        description="Esta proposta será removida. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (!excluirId) return
          deleteMutation.mutate(excluirId, { onSuccess: () => setExcluirId(null) })
        }}
      />
    </div>
  )
}

function Info({ termo, valor }: { termo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{termo}</dt>
      <dd className="mt-0.5 text-foreground">
        {termo === "Responsável" ? <Badge variant="secondary" className="font-normal">{valor}</Badge> : valor}
      </dd>
    </div>
  )
}

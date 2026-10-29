import { useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import ConfirmDialog from "@/components/shared/ConfirmDialog"
import { useAuthStore } from "@/store/auth-store"
import AprovarCompraDialog from "@/features/compras/components/AprovarCompraDialog"
import PainelSolicitacaoCompra from "@/features/compras/components/PainelSolicitacaoCompra"
import {
  useAprovarSolicitacao,
  useSolicitacaoCompra,
  useUpdateStatusCompra,
} from "@/features/compras/hooks/useCompras"
import { isSindico } from "@/features/compras/lib/compra-flow"
import { compraListaFromDetalhe } from "@/features/compras/lib/compra-list-params"
import type { SolicitacaoCompra, TipoAprovacao } from "@/features/compras/types/compra.types"

interface AprovarDialogState {
  id: string
  tipoAprovacao: TipoAprovacao
  valorTotal?: number
}

export default function CompraDetalhePage() {
  const { id = "" } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const cargo = useAuthStore((s) => s.user?.cargo)
  const voltarPara = compraListaFromDetalhe(searchParams)
  const solicitacaoQuery = useSolicitacaoCompra(id)
  const solicitacao = solicitacaoQuery.data

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
          <ShoppingCart className="text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Não foi possível abrir a compra</h3>
        <p className="mt-1 text-sm text-gray-500">A solicitação não existe ou você não tem acesso a ela.</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate(voltarPara)}>
          Voltar para compras
        </Button>
      </div>
    )
  }

  return (
    <CompraDetalheConteudo
      key={solicitacao.id}
      solicitacao={solicitacao}
      sindico={!!cargo && isSindico(cargo)}
      voltarPara={voltarPara}
    />
  )
}

function CompraDetalheConteudo({
  solicitacao,
  sindico,
  voltarPara,
}: {
  solicitacao: SolicitacaoCompra
  sindico: boolean
  voltarPara: string
}) {
  const aprovarMutation = useAprovarSolicitacao()
  const updateStatusMutation = useUpdateStatusCompra()
  const [aprovarDialog, setAprovarDialog] = useState<AprovarDialogState | null>(null)
  const [cancelarDialog, setCancelarDialog] = useState<{ id: string; nome: string } | null>(null)

  return (
    <>
      <PainelSolicitacaoCompra
        solicitacao={solicitacao}
        sindico={sindico}
        statusPending={updateStatusMutation.isPending}
        aprovarPending={aprovarMutation.isPending}
        voltarPara={voltarPara}
        onAprovar={setAprovarDialog}
        onCancelar={setCancelarDialog}
        onReativar={(solicitacaoId) =>
          updateStatusMutation.mutate({ id: solicitacaoId, status: "em_andamento" })
        }
        onFinalizar={(solicitacaoId) =>
          updateStatusMutation.mutate({ id: solicitacaoId, status: "finalizada" })
        }
      />

      <ConfirmDialog
        open={cancelarDialog !== null}
        onOpenChange={(open) => { if (!open) setCancelarDialog(null) }}
        title="Cancelar solicitação"
        description={`Tem certeza que deseja cancelar "${cancelarDialog?.nome ?? "esta solicitação"}"?`}
        confirmLabel="Confirmar cancelamento"
        isPending={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!cancelarDialog) return
          updateStatusMutation.mutate(
            { id: cancelarDialog.id, status: "cancelada" },
            { onSuccess: () => setCancelarDialog(null) },
          )
        }}
      />

      {aprovarDialog && (
        <AprovarCompraDialog
          open
          onOpenChange={(open) => { if (!open) setAprovarDialog(null) }}
          tipoAprovacao={aprovarDialog.tipoAprovacao}
          valorTotal={aprovarDialog.valorTotal}
          onConfirm={() => {
            aprovarMutation.mutate(aprovarDialog.id, {
              onSuccess: () => setAprovarDialog(null),
            })
          }}
          isPending={aprovarMutation.isPending}
        />
      )}
    </>
  )
}

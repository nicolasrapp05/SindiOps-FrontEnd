import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/components/shared/ConfirmDialog"
import { proximosStatus } from "@/lib/status-transitions"
import type { FluxoStatus } from "@/lib/status-transitions"
import type { SolicitacaoStatus } from "@/features/manutencoes/types/solicitacao-manutencao.types"

interface ConfirmacaoAcao {
  title: string
  description: string
  confirmLabel: string
}

interface AcaoStatus {
  destino: SolicitacaoStatus
  label: string
  primaria: boolean
  confirmacao?: ConfirmacaoAcao
}

function descreverAcao(atual: SolicitacaoStatus, destino: FluxoStatus): AcaoStatus | null {
  if (destino === "em_andamento" && atual === "nova") {
    return { destino, label: "Iniciar", primaria: true }
  }
  if (destino === "em_andamento" && atual === "cancelada") {
    return { destino, label: "Reabrir", primaria: true }
  }
  if (destino === "finalizada") {
    return {
      destino,
      label: "Finalizar",
      primaria: true,
      confirmacao: {
        title: "Finalizar chamado",
        description: "O chamado será marcado como finalizado e a data de conclusão será a de hoje.",
        confirmLabel: "Finalizar",
      },
    }
  }
  if (destino === "cancelada") {
    return {
      destino,
      label: "Cancelar",
      primaria: false,
      confirmacao: {
        title: "Cancelar chamado",
        description: "O chamado será cancelado. Ele pode ser reaberto depois.",
        confirmLabel: "Cancelar chamado",
      },
    }
  }
  return null
}

function acoesParaStatus(status: SolicitacaoStatus): AcaoStatus[] {
  return proximosStatus(status).flatMap((destino) => {
    const acao = descreverAcao(status, destino)
    return acao ? [acao] : []
  })
}

interface AcoesStatusChamadoProps {
  status: SolicitacaoStatus
  pending?: boolean
  onChange: (status: SolicitacaoStatus) => void | Promise<unknown>
}

export default function AcoesStatusChamado({
  status,
  pending = false,
  onChange,
}: AcoesStatusChamadoProps) {
  const acoes = acoesParaStatus(status)
  const [confirmando, setConfirmando] = useState<AcaoStatus | null>(null)
  const [enviando, setEnviando] = useState(false)
  const ultimaConfirmacao = useRef<AcaoStatus | null>(null)
  if (confirmando) ultimaConfirmacao.current = confirmando
  const dialogo = confirmando ?? ultimaConfirmacao.current

  if (acoes.length === 0) return null

  async function executar(destino: SolicitacaoStatus) {
    setEnviando(true)
    try {
      await onChange(destino)
      setConfirmando(null)
    } catch {
      // O hook de status já mostra o erro.
    } finally {
      setEnviando(false)
    }
  }

  function escolher(acao: AcaoStatus) {
    if (acao.confirmacao) {
      setConfirmando(acao)
      return
    }
    void executar(acao.destino)
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {acoes.map((acao) => (
          <Button
            key={acao.destino}
            type="button"
            variant={acao.primaria ? "default" : "outline"}
            className={acao.primaria ? undefined : "border-red-200 text-red-600 hover:bg-red-50"}
            disabled={pending || enviando}
            onClick={() => escolher(acao)}
          >
            {acao.label}
          </Button>
        ))}
      </div>
      <ConfirmDialog
        open={confirmando != null}
        onOpenChange={(open) => {
          if (!open) setConfirmando(null)
        }}
        title={dialogo?.confirmacao?.title ?? ""}
        description={dialogo?.confirmacao?.description ?? ""}
        confirmLabel={dialogo?.confirmacao?.confirmLabel}
        isPending={enviando}
        onConfirm={() => {
          if (dialogo) void executar(dialogo.destino)
        }}
      />
    </>
  )
}

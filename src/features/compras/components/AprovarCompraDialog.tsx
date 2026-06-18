import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatBRL } from "@/lib/currency"
import type { TipoAprovacao } from "../types/compra.types"

interface AprovarCompraDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoAprovacao: TipoAprovacao
  valorTotal?: number
  onConfirm: () => void
  isPending?: boolean
}

const TIPO_LABEL: Record<TipoAprovacao, string> = {
  sindico: "síndico",
  conselho: "conselho",
  assembleia: "assembleia",
}

export default function AprovarCompraDialog({
  open,
  onOpenChange,
  tipoAprovacao,
  valorTotal,
  onConfirm,
  isPending,
}: AprovarCompraDialogProps) {
  const [deliberacaoRegistrada, setDeliberacaoRegistrada] = useState(false)
  const exigeDeliberacao = tipoAprovacao === "conselho" || tipoAprovacao === "assembleia"

  const handleOpenChange = (next: boolean) => {
    if (!next) setDeliberacaoRegistrada(false)
    if (!isPending) onOpenChange(next)
  }

  const valorLabel = valorTotal != null ? ` (${formatBRL(valorTotal)})` : ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-700" aria-hidden />
          </div>
          <DialogTitle className="text-center">
            Aprovar compra{valorLabel}
          </DialogTitle>
          <DialogDescription className="text-center">
            {exigeDeliberacao
              ? `Esta solicitação exige aprovação do ${TIPO_LABEL[tipoAprovacao]}. Confirme que a deliberação foi registrada antes de prosseguir.`
              : "A solicitação passará para em andamento e as cotações serão bloqueadas."}
          </DialogDescription>
        </DialogHeader>

        {exigeDeliberacao && (
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/40 p-3">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border"
              checked={deliberacaoRegistrada}
              onChange={(e) => setDeliberacaoRegistrada(e.target.checked)}
            />
            <span className="text-sm leading-snug">
              Deliberação do {TIPO_LABEL[tipoAprovacao]} registrada
            </span>
          </label>
        )}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" disabled={isPending} onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-emerald-700 text-white hover:bg-emerald-800"
            disabled={isPending || (exigeDeliberacao && !deliberacaoRegistrada)}
            onClick={() => {
              onConfirm()
              setDeliberacaoRegistrada(false)
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aprovando...
              </>
            ) : (
              "Aprovar compra"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

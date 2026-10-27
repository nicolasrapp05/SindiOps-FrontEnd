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

interface AprovarOrcamentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prestador?: string
  valor?: number
  onConfirm: () => void
  isPending?: boolean
}

export default function AprovarOrcamentoDialog({
  open,
  onOpenChange,
  prestador,
  valor,
  onConfirm,
  isPending,
}: AprovarOrcamentoDialogProps) {
  const valorLabel = valor != null ? ` de ${formatBRL(valor)}` : ""

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-700" aria-hidden />
          </div>
          <DialogTitle className="text-center">Aprovar orçamento{valorLabel}</DialogTitle>
          <DialogDescription className="text-center">
            {prestador
              ? `A proposta de ${prestador} será a vencedora. As demais permanecem visíveis e o mapa fica bloqueado.`
              : "A proposta selecionada será a vencedora. As demais permanecem visíveis e o mapa fica bloqueado."}
            {" "}
            Se o chamado ainda estiver novo, ele passa para em andamento.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={isPending} onClick={onConfirm}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Aguarde…
              </>
            ) : (
              "Aprovar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

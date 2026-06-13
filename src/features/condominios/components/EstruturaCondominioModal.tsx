import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import EstruturaCondominio from "./EstruturaCondominio"

interface EstruturaCondominioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  condominioId: string
  condominioNome: string
}

export default function EstruturaCondominioModal({
  open,
  onOpenChange,
  condominioId,
  condominioNome,
}: EstruturaCondominioModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Blocos e Unidades — {condominioNome}</DialogTitle>
        </DialogHeader>
        <EstruturaCondominio
          condominioId={condominioId}
          condominioNome={condominioNome}
        />
      </DialogContent>
    </Dialog>
  )
}

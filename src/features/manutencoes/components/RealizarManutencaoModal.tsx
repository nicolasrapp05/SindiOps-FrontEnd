import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { RealizarManutencaoRequest } from "../types/manutencao-obrigatoria.types"

const schema = z.object({
  dataRealizacao: z
    .string()
    .min(1, "Informe a data da realização")
    .refine((val) => {
      const d = new Date(val + "T23:59:59")
      const now = new Date()
      return d <= now
    }, "A data não pode ser futura"),
  observacoes: z.string().optional().or(z.literal("")),
})

type FormData = z.infer<typeof schema>

interface RealizarManutencaoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manutencaoId: string
  onConfirm: (data: RealizarManutencaoRequest) => void
  isSubmitting: boolean
}

export default function RealizarManutencaoModal({
  open,
  onOpenChange,
  manutencaoId,
  onConfirm,
  isSubmitting,
}: RealizarManutencaoModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { dataRealizacao: "", observacoes: "" },
  })

  useEffect(() => {
    if (open) {
      reset({ dataRealizacao: "", observacoes: "" })
    }
  }, [open, reset])

  const onSubmit = (values: FormData) => {
    onConfirm({
      dataRealizacao: values.dataRealizacao,
      observacoes: values.observacoes?.trim() || undefined,
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden />
          </div>
          <DialogTitle className="text-center">Registrar Realização</DialogTitle>
          <DialogDescription className="text-center">
            A data de realização será registrada e o status da manutenção obrigatória será
            atualizado conforme as regras do condomínio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`data-realizacao-${manutencaoId}`}>Data da Realização *</Label>
            <Controller
              name="dataRealizacao"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={`data-realizacao-${manutencaoId}`}
                  type="date"
                  max={today}
                  aria-invalid={!!errors.dataRealizacao}
                />
              )}
            />
            {errors.dataRealizacao && (
              <p className="text-xs text-destructive">{errors.dataRealizacao.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`obs-${manutencaoId}`}>Observações</Label>
            <Controller
              name="observacoes"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id={`obs-${manutencaoId}`}
                  rows={3}
                  placeholder="Notas sobre a execução do serviço..."
                />
              )}
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Confirmar Realização"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

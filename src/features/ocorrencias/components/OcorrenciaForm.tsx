import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  ORIGEM_LABEL,
  TIPO_LABEL,
  TIPO_LOCAL_LABEL,
} from "../types/ocorrencia.types"
import type { CreateOcorrenciaRequest, OcorrenciaOrigem, OcorrenciaTipo, TipoLocal } from "../types/ocorrencia.types"

const formSchema = z.object({
  origem: z.string().min(1, "Obrigatório"),
  tipoLocal: z.string().min(1, "Obrigatório"),
  tipoOcorrencia: z.string().min(1, "Obrigatório"),
  ocorreuEm: z.string().min(1, "Obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  moradorId: z.string().optional().or(z.literal("")),
  blocoId: z.string().optional().or(z.literal("")),
  unidadeId: z.string().optional().or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

interface OcorrenciaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  condominioId: string
  onSubmit: (data: CreateOcorrenciaRequest) => void
  isSubmitting: boolean
}

export default function OcorrenciaForm({
  open, onOpenChange, condominioId, onSubmit, isSubmitting,
}: OcorrenciaFormProps) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origem: "", tipoLocal: "", tipoOcorrencia: "", ocorreuEm: "",
      descricao: "", moradorId: "", blocoId: "", unidadeId: "",
    },
  })

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const onFormSubmit = (data: FormData) => {
    onSubmit({
      condominioId,
      origem: data.origem as OcorrenciaOrigem,
      tipoLocal: data.tipoLocal as TipoLocal,
      tipoOcorrencia: data.tipoOcorrencia as OcorrenciaTipo,
      descricao: data.descricao,
      ocorreuEm: data.ocorreuEm,
      moradorId: data.moradorId || undefined,
      blocoId: data.blocoId || undefined,
      unidadeId: data.unidadeId || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Ocorrência</DialogTitle>
          <DialogDescription>Registre uma nova ocorrência no condomínio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Origem *</Label>
              <Controller control={control} name="origem" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORIGEM_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.origem && <p className="text-xs text-red-500">{errors.origem.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Local *</Label>
              <Controller control={control} name="tipoLocal" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LOCAL_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.tipoLocal && <p className="text-xs text-red-500">{errors.tipoLocal.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de Ocorrência *</Label>
              <Controller control={control} name="tipoOcorrencia" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.tipoOcorrencia && <p className="text-xs text-red-500">{errors.tipoOcorrencia.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Data e Hora *</Label>
              <Input type="datetime-local" {...register("ocorreuEm")} />
              {errors.ocorreuEm && <p className="text-xs text-red-500">{errors.ocorreuEm.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Textarea placeholder="Descreva a ocorrência em detalhes..." rows={4} {...register("descricao")} />
            {errors.descricao && <p className="text-xs text-red-500">{errors.descricao.message}</p>}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Ocorrência
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

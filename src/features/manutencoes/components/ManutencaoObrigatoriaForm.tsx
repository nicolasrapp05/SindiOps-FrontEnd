import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MANUTENCAO_TIPO_LABEL,
  type CreateManutencaoObrigatoriaRequest,
  type ManutencaoObrigatoria,
  type ManutencaoTipo,
} from "../types/manutencao-obrigatoria.types"

const TIPOS = Object.keys(MANUTENCAO_TIPO_LABEL) as ManutencaoTipo[]

const tipoEnum = z.enum(TIPOS as [ManutencaoTipo, ...ManutencaoTipo[]])

const schema = z.object({
  condominioId: z.string().min(1, "Informe o ID do condomínio"),
  tipo: tipoEnum,
  dataVencimento: z.string().min(1, "Data de vencimento obrigatória"),
  ultimaRealizacao: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
})

type FormData = z.infer<typeof schema>

interface ManutencaoObrigatoriaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  manutencao?: ManutencaoObrigatoria | null
  onSubmit: (data: CreateManutencaoObrigatoriaRequest) => void
  isSubmitting: boolean
}

export default function ManutencaoObrigatoriaForm({
  open,
  onOpenChange,
  manutencao,
  onSubmit,
  isSubmitting,
}: ManutencaoObrigatoriaFormProps) {
  const isEdit = !!manutencao

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      condominioId: "",
      tipo: "dedetizacao",
      dataVencimento: "",
      ultimaRealizacao: "",
      observacoes: "",
    },
  })

  useEffect(() => {
    if (!open) return
    if (manutencao) {
      reset({
        condominioId: manutencao.condominio.id,
        tipo: manutencao.tipo,
        dataVencimento: manutencao.dataVencimento.slice(0, 10),
        ultimaRealizacao: manutencao.ultimaRealizacao?.slice(0, 10) ?? "",
        observacoes: manutencao.observacoes ?? "",
      })
    } else {
      reset({
        condominioId: "",
        tipo: "dedetizacao",
        dataVencimento: "",
        ultimaRealizacao: "",
        observacoes: "",
      })
    }
  }, [open, manutencao, reset])

  const submit = (values: FormData) => {
    onSubmit({
      condominioId: values.condominioId.trim(),
      tipo: values.tipo,
      dataVencimento: values.dataVencimento,
      ultimaRealizacao: values.ultimaRealizacao?.trim() || undefined,
      observacoes: values.observacoes?.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar manutenção" : "Nova manutenção obrigatória"}</DialogTitle>
          <DialogDescription>
            Preencha os dados da obrigação legal ou contratual do condomínio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mo-condominio">Condomínio (ID)</Label>
            <Controller
              name="condominioId"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="mo-condominio"
                  placeholder="UUID do condomínio"
                  disabled={isEdit}
                  aria-invalid={!!errors.condominioId}
                />
              )}
            />
            {errors.condominioId && (
              <p className="text-xs text-destructive">{errors.condominioId.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-invalid={!!errors.tipo}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {MANUTENCAO_TIPO_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipo && <p className="text-xs text-destructive">{errors.tipo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mo-venc">Data de vencimento *</Label>
            <Controller
              name="dataVencimento"
              control={control}
              render={({ field }) => (
                <Input {...field} id="mo-venc" type="date" aria-invalid={!!errors.dataVencimento} />
              )}
            />
            {errors.dataVencimento && (
              <p className="text-xs text-destructive">{errors.dataVencimento.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mo-ultima">Última realização</Label>
            <Controller
              name="ultimaRealizacao"
              control={control}
              render={({ field }) => <Input {...field} id="mo-ultima" type="date" />}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mo-obs">Observações</Label>
            <Controller
              name="observacoes"
              control={control}
              render={({ field }) => (
                <Textarea {...field} id="mo-obs" rows={3} placeholder="Opcional" />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isEdit ? (
                "Salvar"
              ) : (
                "Cadastrar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

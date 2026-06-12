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
import Combobox from "@/components/shared/Combobox"
import {
  MANUTENCAO_TIPO_LABEL,
  type CreateManutencaoObrigatoriaRequest,
  type ManutencaoObrigatoria,
  type ManutencaoTipo,
} from "../types/manutencao-obrigatoria.types"

const TIPOS = Object.keys(MANUTENCAO_TIPO_LABEL) as ManutencaoTipo[]

const tipoEnum = z.enum(TIPOS as [ManutencaoTipo, ...ManutencaoTipo[]])

const schema = z.object({
  tipo: tipoEnum,
  dataVencimento: z.string().min(1, "Data de vencimento obrigatória"),
  ultimaRealizacao: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || new Date(v) <= new Date(),
      { message: "A data não pode ser futura" },
    ),
  observacoes: z.string().optional().or(z.literal("")),
})

type FormData = z.infer<typeof schema>

interface ManutencaoObrigatoriaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  condominioId: string
  condominioNome?: string | null
  manutencao?: ManutencaoObrigatoria | null
  onSubmit: (data: CreateManutencaoObrigatoriaRequest) => void
  isSubmitting: boolean
}

export default function ManutencaoObrigatoriaForm({
  open,
  onOpenChange,
  condominioId,
  condominioNome,
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
        tipo: manutencao.tipo,
        dataVencimento: manutencao.dataVencimento.slice(0, 10),
        ultimaRealizacao: manutencao.ultimaRealizacao?.slice(0, 10) ?? "",
        observacoes: manutencao.observacoes ?? "",
      })
    } else {
      reset({
        tipo: "dedetizacao",
        dataVencimento: "",
        ultimaRealizacao: "",
        observacoes: "",
      })
    }
  }, [open, manutencao, reset])

  const submit = (values: FormData) => {
    onSubmit({
      condominioId,
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
          <div className="space-y-1.5">
            <Label>Condomínio</Label>
            <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
              {condominioNome || "—"}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={TIPOS.map((t) => ({ value: t, label: MANUTENCAO_TIPO_LABEL[t] }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecionar tipo..."
                />
              )}
            />
            {errors.tipo && <p className="text-xs text-destructive">{errors.tipo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mo-venc">Data de vencimento<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
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
              render={({ field }) => (
                <Input
                  {...field}
                  id="mo-ultima"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  aria-invalid={!!errors.ultimaRealizacao}
                />
              )}
            />
            {errors.ultimaRealizacao && (
              <p className="text-xs text-destructive">{errors.ultimaRealizacao.message}</p>
            )}
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

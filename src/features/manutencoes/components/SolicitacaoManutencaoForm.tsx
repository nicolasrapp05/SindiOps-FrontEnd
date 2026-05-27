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
import { cn } from "@/lib/utils"
import {
  SOLICITACAO_TIPO_LABEL,
  type CreateSolicitacaoManutencaoRequest,
  type SolicitacaoTipoServico,
} from "../types/solicitacao-manutencao.types"
import { useFornecedores } from "@/features/fornecedores/hooks/useFornecedores"
import Combobox from "@/components/shared/Combobox"

const TIPOS = Object.keys(SOLICITACAO_TIPO_LABEL) as SolicitacaoTipoServico[]

const tipoEnum = z.enum(
  TIPOS as [SolicitacaoTipoServico, ...SolicitacaoTipoServico[]],
)

const schema = z
  .object({
    tipoServico: tipoEnum,
    local: z.string().min(1, "Informe o local"),
    responsavel: z.enum(["fornecedor", "zelador"]),
    fornecedorId: z.string().optional().or(z.literal("")),
    descricao: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.responsavel === "fornecedor" && !data.fornecedorId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione o fornecedor",
        path: ["fornecedorId"],
      })
    }
  })

type FormData = z.infer<typeof schema>

interface SolicitacaoManutencaoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateSolicitacaoManutencaoRequest) => void
  isSubmitting: boolean
  condominioId: string
}

export default function SolicitacaoManutencaoForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  condominioId,
}: SolicitacaoManutencaoFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipoServico: "obra_civil",
      local: "",
      responsavel: "zelador",
      fornecedorId: "",
      descricao: "",
    },
  })

  const responsavel = watch("responsavel")

  const { data: fornecedoresData } = useFornecedores(undefined)
  const fornecedoresList = Array.isArray(fornecedoresData) ? fornecedoresData : []

  useEffect(() => {
    if (open) {
      reset({
        tipoServico: "obra_civil",
        local: "",
        responsavel: "zelador",
        fornecedorId: "",
        descricao: "",
      })
    }
  }, [open, reset])

  const submit = (values: FormData) => {
    onSubmit({
      condominioId,
      tipoServico: values.tipoServico,
      local: values.local.trim(),
      responsavel: values.responsavel,
      descricao: values.descricao?.trim() || undefined,
      fornecedorId:
        values.responsavel === "fornecedor" ? values.fornecedorId?.trim() : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Nova solicitação de manutenção</DialogTitle>
          <DialogDescription>Descreva o serviço e quem deve executá-lo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de serviço *</Label>
            <Controller
              name="tipoServico"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-invalid={!!errors.tipoServico}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {SOLICITACAO_TIPO_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sol-local">Local *</Label>
            <Controller
              name="local"
              control={control}
              render={({ field }) => (
                <Input {...field} id="sol-local" placeholder="Ex.: Hall do bloco A" />
              )}
            />
            {errors.local && (
              <p className="text-xs text-destructive">{errors.local.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Responsável *</Label>
            <Controller
              name="responsavel"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex-1",
                      field.value === "fornecedor" && "ring-2 ring-emerald-600 ring-offset-2",
                    )}
                    onClick={() => field.onChange("fornecedor")}
                  >
                    Fornecedor Externo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex-1",
                      field.value === "zelador" && "ring-2 ring-emerald-600 ring-offset-2",
                    )}
                    onClick={() => field.onChange("zelador")}
                  >
                    Equipe de Zeladoria
                  </Button>
                </div>
              )}
            />
          </div>
          {responsavel === "fornecedor" && (
            <div className="space-y-2">
              <Label>Fornecedor *</Label>
              <Controller
                name="fornecedorId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={fornecedoresList.map((f) => ({ value: f.id, label: f.nome }))}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    placeholder="Selecionar fornecedor"
                    searchPlaceholder="Buscar fornecedor..."
                  />
                )}
              />
              {errors.fornecedorId && (
                <p className="text-xs text-destructive">{errors.fornecedorId.message}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="sol-desc">Descrição</Label>
            <Controller
              name="descricao"
              control={control}
              render={({ field }) => (
                <Textarea {...field} id="sol-desc" rows={3} placeholder="Detalhes do problema" />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !condominioId}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Criar solicitação"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Combobox from "@/components/shared/Combobox"
import {
  COMPRA_CATEGORIA_LABEL,
  type CompraCategoria,
  type TipoAprovacao,
  type CreateSolicitacaoCompraRequest,
} from "../types/compra.types"

const TIPO_APROVACAO_LABEL: Record<TipoAprovacao, string> = {
  sindico: "Síndico",
  conselho: "Conselho",
  assembleia: "Assembleia",
}

const schema = z.object({
  categoria: z.enum(["papelaria", "mat_construcao", "mat_limpeza", "mat_especifico"]),
  item: z.string().min(1, "Informe o item"),
  quantidade: z.number().int().positive("Quantidade deve ser maior que zero"),
  eReposicao: z.boolean().optional(),
  justificativa: z.string().optional(),
  tipoAprovacao: z.enum(["sindico", "conselho", "assembleia"]),
})

type FormData = z.infer<typeof schema>

const CATEGORIAS: CompraCategoria[] = [
  "papelaria",
  "mat_construcao",
  "mat_limpeza",
  "mat_especifico",
]

const TIPOS_APROVACAO: TipoAprovacao[] = ["sindico", "conselho", "assembleia"]

interface SolicitacaoCompraFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateSolicitacaoCompraRequest) => void
  isSubmitting: boolean
  condominioId: string
}

export default function SolicitacaoCompraForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  condominioId,
}: SolicitacaoCompraFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoria: "papelaria",
      item: "",
      quantidade: 1,
      eReposicao: false,
      justificativa: "",
      tipoAprovacao: "sindico",
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        categoria: "papelaria",
        item: "",
        quantidade: 1,
        eReposicao: false,
        justificativa: "",
        tipoAprovacao: "sindico",
      })
    }
  }, [open, reset])

  const submit = (data: FormData) => {
    onSubmit({
      condominioId,
      categoria: data.categoria,
      item: data.item,
      quantidade: data.quantidade,
      eReposicao: data.eReposicao,
      justificativa: data.justificativa?.trim() ? data.justificativa : undefined,
      tipoAprovacao: data.tipoAprovacao,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Nova solicitação de compra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Categoria<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
            <Controller
              name="categoria"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={CATEGORIAS.map((c) => ({ value: c, label: COMPRA_CATEGORIA_LABEL[c] }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecionar categoria..."
                />
              )}
            />
            {errors.categoria && (
              <p className="text-xs text-destructive">{errors.categoria.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="item">Item<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
            <Input id="item" {...register("item")} placeholder="Descrição do item" />
            {errors.item && <p className="text-xs text-destructive">{errors.item.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
            <Input
              id="quantidade"
              type="number"
              min={1}
              step={1}
              {...register("quantidade", { valueAsNumber: true })}
            />
            {errors.quantidade && (
              <p className="text-xs text-destructive">{errors.quantidade.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input id="eReposicao" type="checkbox" className="size-4 rounded border" {...register("eReposicao")} />
            <Label htmlFor="eReposicao" className="font-normal">
              É reposição
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa</Label>
            <Textarea id="justificativa" {...register("justificativa")} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Tipo de aprovação<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
            <Controller
              name="tipoAprovacao"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={TIPOS_APROVACAO.map((t) => ({ value: t, label: TIPO_APROVACAO_LABEL[t] }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecionar tipo de aprovação..."
                />
              )}
            />
            {errors.tipoAprovacao && (
              <p className="text-xs text-destructive">{errors.tipoAprovacao.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

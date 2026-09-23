import { useEffect } from "react"
import { useFieldArray, useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus, Trash2 } from "lucide-react"
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
import { toastFormValidationError } from "@/lib/form-utils"
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

const itemSchema = z.object({
  categoria: z.enum(["papelaria", "mat_construcao", "mat_limpeza", "mat_especifico"]),
  descricao: z.string().min(1, "Informe o item"),
  quantidade: z.number({ error: "Informe a quantidade" }).positive("Quantidade deve ser maior que zero"),
  unidade: z.string().optional(),
  eReposicao: z.boolean(),
})

const schema = z.object({
  itens: z.array(itemSchema).min(1, "Informe ao menos um item"),
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

const itemVazio = (): FormData["itens"][number] => ({
  categoria: "papelaria",
  descricao: "",
  quantidade: 1,
  unidade: "",
  eReposicao: false,
})

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
      itens: [itemVazio()],
      justificativa: "",
      tipoAprovacao: "sindico",
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "itens" })

  useEffect(() => {
    if (open) {
      reset({
        itens: [itemVazio()],
        justificativa: "",
        tipoAprovacao: "sindico",
      })
    }
  }, [open, reset])

  const submit = (data: FormData) => {
    onSubmit({
      condominioId,
      itens: data.itens.map((item) => ({
        categoria: item.categoria,
        descricao: item.descricao.trim(),
        quantidade: item.quantidade,
        unidade: item.unidade?.trim() || undefined,
        eReposicao: item.eReposicao,
      })),
      justificativa: data.justificativa?.trim() ? data.justificativa : undefined,
      tipoAprovacao: data.tipoAprovacao,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-4 overflow-hidden sm:max-w-2xl" showCloseButton>
        <DialogHeader className="shrink-0">
          <DialogTitle>Nova solicitação de compra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit, toastFormValidationError)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-700">Item {index + 1}</p>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-600"
                      aria-label={`Remover item ${index + 1}`}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Categoria<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
                  <Controller
                    name={`itens.${index}.categoria`}
                    control={control}
                    render={({ field: categoriaField }) => (
                      <Combobox
                        options={CATEGORIAS.map((c) => ({ value: c, label: COMPRA_CATEGORIA_LABEL[c] }))}
                        value={categoriaField.value}
                        onValueChange={categoriaField.onChange}
                        placeholder="Selecionar categoria..."
                      />
                    )}
                  />
                  {errors.itens?.[index]?.categoria && (
                    <p className="text-xs text-destructive">{errors.itens[index]?.categoria?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`descricao-${field.id}`}>Item<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
                  <Input
                    id={`descricao-${field.id}`}
                    {...register(`itens.${index}.descricao`)}
                    placeholder="Descrição do item…"
                  />
                  {errors.itens?.[index]?.descricao && (
                    <p className="text-xs text-destructive">{errors.itens[index]?.descricao?.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`quantidade-${field.id}`}>Quantidade<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
                    <Input
                      id={`quantidade-${field.id}`}
                      type="number"
                      min={0.01}
                      step="any"
                      inputMode="decimal"
                      {...register(`itens.${index}.quantidade`, { valueAsNumber: true })}
                    />
                    {errors.itens?.[index]?.quantidade && (
                      <p className="text-xs text-destructive">{errors.itens[index]?.quantidade?.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`unidade-${field.id}`}>Unidade</Label>
                    <Input
                      id={`unidade-${field.id}`}
                      {...register(`itens.${index}.unidade`)}
                      placeholder="Ex: un, kg, L"
                    />
                  </div>
                </div>

                <label
                  htmlFor={`eReposicao-${field.id}`}
                  className="flex w-fit items-center gap-2 text-sm font-normal"
                >
                  <input
                    id={`eReposicao-${field.id}`}
                    type="checkbox"
                    className="size-4 rounded border"
                    {...register(`itens.${index}.eReposicao`)}
                  />
                  É reposição
                </label>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(itemVazio())}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Adicionar item
            </Button>
            {errors.itens?.message && (
              <p className="text-xs text-destructive">{errors.itens.message}</p>
            )}
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
          </div>

          <DialogFooter className="shrink-0 gap-2 pt-4 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar solicitação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

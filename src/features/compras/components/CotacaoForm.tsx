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
import { useFornecedores } from "@/features/fornecedores/hooks/useFornecedores"
import Combobox, { type ComboboxOption } from "@/components/shared/Combobox"
import type { Cotacao, CreateCotacaoRequest } from "../types/compra.types"

const schema = z
  .object({
    fornecedorId: z.string().optional(),
    nomeEmpresa: z.string().optional(),
    nomeContato: z.string().optional(),
    nomeResponsavel: z.string().optional(),
    valorUnitario: z
      .number({ invalid_type_error: "Informe o valor unitário" })
      .min(0.01, "Valor deve ser maior que zero"),
    valorTotal: z
      .number({ invalid_type_error: "Informe o valor total" })
      .min(0.01, "Valor deve ser maior que zero"),
    formaPagamento: z.string().optional(),
    descricaoProduto: z.string().optional(),
    quantidade: z.number().optional(),
    unidade: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.fornecedorId && !data.nomeEmpresa?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o nome da empresa ou selecione um fornecedor cadastrado",
        path: ["nomeEmpresa"],
      })
    }
  })

type FormData = z.infer<typeof schema>

interface CotacaoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cotacao?: Cotacao
  isSubmitting: boolean
  onSubmit: (data: CreateCotacaoRequest) => void
}

export default function CotacaoForm({
  open,
  onOpenChange,
  cotacao,
  isSubmitting,
  onSubmit,
}: CotacaoFormProps) {
  const isEditMode = !!cotacao

  const { data: fornecedores } = useFornecedores()
  const fornecedoresList = Array.isArray(fornecedores) ? fornecedores : []

  const fornecedorOptions: ComboboxOption[] = [
    { value: "", label: "Nenhum" },
    ...fornecedoresList.map((f) => ({ value: f.id, label: f.nome })),
  ]

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fornecedorId: "",
      nomeEmpresa: "",
      nomeContato: "",
      nomeResponsavel: "",
      valorUnitario: 0,
      valorTotal: 0,
      formaPagamento: "",
      descricaoProduto: "",
      quantidade: undefined,
      unidade: "",
    },
  })

  useEffect(() => {
    if (open) {
      if (cotacao) {
        reset({
          fornecedorId: cotacao.fornecedor?.id ?? "",
          nomeEmpresa: cotacao.nomeEmpresa ?? "",
          nomeContato: cotacao.nomeContato ?? "",
          nomeResponsavel: cotacao.nomeResponsavel ?? "",
          valorUnitario: cotacao.valorUnitario,
          valorTotal: cotacao.valorTotal,
          formaPagamento: cotacao.formaPagamento ?? "",
          descricaoProduto: cotacao.descricaoProduto ?? "",
          quantidade: cotacao.quantidade ?? undefined,
          unidade: cotacao.unidade ?? "",
        })
      } else {
        reset({
          fornecedorId: "",
          nomeEmpresa: "",
          nomeContato: "",
          nomeResponsavel: "",
          valorUnitario: 0,
          valorTotal: 0,
          formaPagamento: "",
          descricaoProduto: "",
          quantidade: undefined,
          unidade: "",
        })
      }
    }
  }, [open, cotacao, reset])

  const submit = (data: FormData) => {
    onSubmit({
      fornecedorId: data.fornecedorId?.trim() || undefined,
      nomeEmpresa: data.nomeEmpresa?.trim() || undefined,
      nomeContato: data.nomeContato?.trim() || undefined,
      nomeResponsavel: data.nomeResponsavel?.trim() || undefined,
      valorUnitario: data.valorUnitario,
      valorTotal: data.valorTotal,
      formaPagamento: data.formaPagamento?.trim() || undefined,
      descricaoProduto: data.descricaoProduto?.trim() || undefined,
      quantidade: data.quantidade ?? undefined,
      unidade: data.unidade?.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar cotação" : "Nova cotação"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Fornecedor cadastrado</Label>
            <Controller
              name="fornecedorId"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={fornecedorOptions}
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  placeholder="Selecione (opcional)"
                  searchPlaceholder="Buscar fornecedor..."
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nomeEmpresa">
              Nome da empresa{" "}
              <span className="text-xs text-muted-foreground">(obrigatório se sem fornecedor)</span>
            </Label>
            <Input
              id="nomeEmpresa"
              {...register("nomeEmpresa")}
              placeholder="Ex: Distribuidora ABC"
            />
            {errors.nomeEmpresa && (
              <p className="text-xs text-destructive">{errors.nomeEmpresa.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nomeContato">Contato</Label>
              <Input id="nomeContato" {...register("nomeContato")} placeholder="Nome do contato" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeResponsavel">Responsável</Label>
              <Input
                id="nomeResponsavel"
                {...register("nomeResponsavel")}
                placeholder="Responsável interno"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="valorUnitario">Valor unitário<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
              <Input
                id="valorUnitario"
                type="number"
                min={0.01}
                step={0.01}
                {...register("valorUnitario", { valueAsNumber: true })}
              />
              {errors.valorUnitario && (
                <p className="text-xs text-destructive">{errors.valorUnitario.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor total<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
              <Input
                id="valorTotal"
                type="number"
                min={0.01}
                step={0.01}
                {...register("valorTotal", { valueAsNumber: true })}
              />
              {errors.valorTotal && (
                <p className="text-xs text-destructive">{errors.valorTotal.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min={1}
                step={1}
                {...register("quantidade", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Input id="unidade" {...register("unidade")} placeholder="Ex: unidade, kg, L" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formaPagamento">Forma de pagamento</Label>
            <Input
              id="formaPagamento"
              {...register("formaPagamento")}
              placeholder="Ex: PIX, boleto 30 dias"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricaoProduto">Descrição do produto</Label>
            <Input
              id="descricaoProduto"
              {...register("descricaoProduto")}
              placeholder="Ex: Detergente Limpmax 5L"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Salvar alterações" : "Adicionar cotação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
import CurrencyInput from "@/components/shared/CurrencyInput"
import { toastFormValidationError } from "@/lib/form-utils"
import {
  calcValorTotalCotacao,
  resolveQuantidadeCotacao,
} from "../lib/cotacao-utils"
import type { Cotacao, CreateCotacaoRequest } from "../types/compra.types"

const schema = z
  .object({
    fornecedorId: z.string().optional(),
    nomeEmpresa: z.string().optional(),
    nomeContato: z.string().optional(),
    nomeResponsavel: z.string().optional(),
    valorUnitario: z.number({ error: "Informe o valor unitário" }).min(0.01, "Valor deve ser maior que zero"),
    formaPagamento: z.string().optional(),
    descricaoProduto: z.string().optional(),
    quantidade: z
      .number({ error: "Informe a quantidade" })
      .min(1, "Quantidade deve ser maior que zero"),
    unidade: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasFornecedor = !!data.fornecedorId?.trim()
    if (!hasFornecedor && !data.nomeEmpresa?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o nome da empresa ou selecione um fornecedor cadastrado",
        path: ["nomeEmpresa"],
      })
    }
    if (hasFornecedor && data.nomeEmpresa?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nome da empresa não deve ser informado quando um fornecedor está selecionado",
        path: ["nomeEmpresa"],
      })
    }
  })

type FormData = z.infer<typeof schema>

interface CotacaoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cotacao?: Cotacao
  quantidadeSolicitacao: number
  isSubmitting: boolean
  onSubmit: (data: CreateCotacaoRequest) => void
}

export default function CotacaoForm({
  open,
  onOpenChange,
  cotacao,
  quantidadeSolicitacao,
  isSubmitting,
  onSubmit,
}: CotacaoFormProps) {
  const isEditMode = !!cotacao

  const { data: fornecedoresData } = useFornecedores({ pageSize: 500 })
  const fornecedoresList = fornecedoresData?.data ?? []

  const fornecedorOptions: ComboboxOption[] = [
    { value: "", label: "Nenhum" },
    ...fornecedoresList.map((f) => ({ value: f.id, label: f.nome })),
  ]

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fornecedorId: "",
      nomeEmpresa: "",
      nomeContato: "",
      nomeResponsavel: "",
      valorUnitario: 0,
      formaPagamento: "",
      descricaoProduto: "",
      quantidade: quantidadeSolicitacao,
      unidade: "",
    },
  })

  const valorUnitario = watch("valorUnitario")
  const quantidade = watch("quantidade")
  const fornecedorId = watch("fornecedorId")
  const selectedFornecedor = fornecedoresList.find((f) => f.id === fornecedorId)
  const hasFornecedor = !!fornecedorId?.trim()
  const quantidadeEfetiva = resolveQuantidadeCotacao(quantidade, quantidadeSolicitacao)
  const valorTotalCalculado = calcValorTotalCotacao(
    Number.isFinite(valorUnitario) ? valorUnitario : 0,
    quantidadeEfetiva,
  )

  useEffect(() => {
    if (open) {
      if (cotacao) {
        reset({
          fornecedorId: cotacao.fornecedor?.id ?? "",
          nomeEmpresa: cotacao.fornecedor?.id ? "" : (cotacao.nomeEmpresa ?? ""),
          nomeContato: cotacao.nomeContato ?? "",
          nomeResponsavel: cotacao.nomeResponsavel ?? "",
          valorUnitario: cotacao.valorUnitario,
          formaPagamento: cotacao.formaPagamento ?? "",
          descricaoProduto: cotacao.descricaoProduto ?? "",
          quantidade: cotacao.quantidade ?? quantidadeSolicitacao,
          unidade: cotacao.unidade ?? "",
        })
      } else {
        reset({
          fornecedorId: "",
          nomeEmpresa: "",
          nomeContato: "",
          nomeResponsavel: "",
          valorUnitario: 0,
          formaPagamento: "",
          descricaoProduto: "",
          quantidade: quantidadeSolicitacao,
          unidade: "",
        })
      }
    }
  }, [open, cotacao, quantidadeSolicitacao, reset])

  const applyFornecedorSelection = (id: string) => {
    setValue("nomeEmpresa", "")

    if (!id) {
      setValue("nomeContato", "")
      return
    }

    const fornecedor = fornecedoresList.find((f) => f.id === id)
    if (!fornecedor) return

    setValue("nomeContato", fornecedor.nomeContato ?? "")
  }

  const submit = (data: FormData) => {
    const qtd = resolveQuantidadeCotacao(data.quantidade, quantidadeSolicitacao)
    const linkedFornecedor = !!data.fornecedorId?.trim()
    onSubmit({
      fornecedorId: linkedFornecedor ? data.fornecedorId!.trim() : undefined,
      nomeEmpresa: linkedFornecedor ? undefined : data.nomeEmpresa?.trim() || undefined,
      nomeContato: data.nomeContato?.trim() || undefined,
      nomeResponsavel: data.nomeResponsavel?.trim() || undefined,
      valorUnitario: data.valorUnitario,
      valorTotal: calcValorTotalCotacao(data.valorUnitario, qtd),
      formaPagamento: data.formaPagamento?.trim() || undefined,
      descricaoProduto: data.descricaoProduto?.trim() || undefined,
      quantidade: qtd,
      unidade: data.unidade?.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar cotação" : "Nova cotação"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit, toastFormValidationError)} className="space-y-4">
          <div className="space-y-2">
            <Label>Fornecedor cadastrado</Label>
            <Controller
              name="fornecedorId"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={fornecedorOptions}
                  value={field.value || ""}
                  onValueChange={(id) => {
                    field.onChange(id)
                    applyFornecedorSelection(id)
                  }}
                  placeholder="Selecione (opcional)"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={hasFornecedor ? undefined : "nomeEmpresa"}>
              Nome da empresa{" "}
              {!hasFornecedor && (
                <span className="text-xs text-muted-foreground">(obrigatório se sem fornecedor)</span>
              )}
            </Label>
            {hasFornecedor ? (
              <>
                <div
                  id="nomeEmpresa"
                  className="flex h-8 items-center rounded-lg border border-input bg-muted/50 px-2.5 text-sm text-foreground"
                >
                  {selectedFornecedor?.nome ?? cotacao?.fornecedor?.nome ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Vinculado ao fornecedor selecionado
                </p>
              </>
            ) : (
              <Input
                id="nomeEmpresa"
                {...register("nomeEmpresa")}
                placeholder="Ex: Distribuidora ABC"
              />
            )}
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
              <Controller
                name="valorUnitario"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="valorUnitario"
                    value={field.value}
                    onValueChange={field.onChange}
                    aria-invalid={!!errors.valorUnitario}
                  />
                )}
              />
              {errors.valorUnitario && (
                <p className="text-xs text-destructive">{errors.valorUnitario.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorTotal">Valor total</Label>
            <CurrencyInput
              id="valorTotal"
              readOnly
              tabIndex={-1}
              value={valorTotalCalculado}
              className="bg-muted/50 font-medium"
            />
            <p className="text-xs text-muted-foreground">
              Calculado automaticamente: unitário × quantidade
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidade">Unidade</Label>
            <Input id="unidade" {...register("unidade")} placeholder="Ex: unidade, kg, L" />
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

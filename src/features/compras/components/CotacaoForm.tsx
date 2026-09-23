import { useEffect, useMemo } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { brl, calcValorTotalCotacao, somarValorTotalCotacao } from "../lib/cotacao-utils"
import {
  COMPRA_CATEGORIA_LABEL,
  type Cotacao,
  type CreateCotacaoRequest,
  type SolicitacaoCompraItem,
} from "../types/compra.types"

const schema = z
  .object({
    fornecedorId: z.string().optional(),
    nomeEmpresa: z.string().optional(),
    nomeContato: z.string().optional(),
    nomeResponsavel: z.string().optional(),
    formaPagamento: z.string().optional(),
    linhas: z
      .array(
        z.object({
          itemId: z.string().min(1),
          valorUnitario: z
            .number({ error: "Informe o valor unitário" })
            .min(0.01, "Valor deve ser maior que zero")
            .optional(),
        }),
      )
      .min(1, "Informe o valor de cada item"),
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
    data.linhas.forEach((linha, index) => {
      if (linha.valorUnitario == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o valor unitário",
          path: ["linhas", index, "valorUnitario"],
        })
      }
    })
  })

type FormData = z.infer<typeof schema>

interface CotacaoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cotacao?: Cotacao
  itensSolicitacao: SolicitacaoCompraItem[]
  isSubmitting: boolean
  onSubmit: (data: CreateCotacaoRequest) => void
}

function linhasDaSolicitacao(
  itens: SolicitacaoCompraItem[],
  cotacao?: Cotacao,
): FormData["linhas"] {
  return itens.map((item) => ({
    itemId: item.id,
    valorUnitario: cotacao?.itens.find((linha) => linha.itemId === item.id)?.valorUnitario,
  }))
}

export default function CotacaoForm({
  open,
  onOpenChange,
  cotacao,
  itensSolicitacao,
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
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fornecedorId: "",
      nomeEmpresa: "",
      nomeContato: "",
      nomeResponsavel: "",
      formaPagamento: "",
      linhas: linhasDaSolicitacao(itensSolicitacao),
    },
  })

  const linhas = useWatch({ control, name: "linhas" })
  const fornecedorId = useWatch({ control, name: "fornecedorId" })
  const selectedFornecedor = fornecedoresList.find((f) => f.id === fornecedorId)
  const hasFornecedor = !!fornecedorId?.trim()

  const valorTotalCalculado = useMemo(() => {
    const precos = itensSolicitacao.map((item) => {
      const valor = linhas?.find((linha) => linha.itemId === item.id)?.valorUnitario
      return typeof valor === "number" && valor >= 0.01 ? valor : null
    })
    if (precos.some((valor) => valor == null)) return null
    return somarValorTotalCotacao(
      itensSolicitacao.map((item, index) => ({
        quantidade: item.quantidade,
        valorUnitario: precos[index] ?? 0,
      })),
    )
  }, [itensSolicitacao, linhas])

  useEffect(() => {
    if (!open) return
    reset({
      fornecedorId: cotacao?.fornecedor?.id ?? "",
      nomeEmpresa: cotacao?.fornecedor?.id ? "" : (cotacao?.nomeEmpresa ?? ""),
      nomeContato: cotacao?.nomeContato ?? "",
      nomeResponsavel: cotacao?.nomeResponsavel ?? "",
      formaPagamento: cotacao?.formaPagamento ?? "",
      linhas: linhasDaSolicitacao(itensSolicitacao, cotacao),
    })
  }, [open, cotacao, itensSolicitacao, reset])

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
    const linkedFornecedor = !!data.fornecedorId?.trim()
    onSubmit({
      fornecedorId: linkedFornecedor ? data.fornecedorId!.trim() : undefined,
      nomeEmpresa: linkedFornecedor ? undefined : data.nomeEmpresa?.trim() || undefined,
      nomeContato: data.nomeContato?.trim() || undefined,
      nomeResponsavel: data.nomeResponsavel?.trim() || undefined,
      formaPagamento: data.formaPagamento?.trim() || undefined,
      itens: data.linhas.map((linha) => ({
        itemId: linha.itemId,
        valorUnitario: linha.valorUnitario ?? 0,
      })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-4 overflow-hidden sm:max-w-2xl" showCloseButton>
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEditMode ? "Editar cotação" : "Nova cotação"}</DialogTitle>
          <DialogDescription>
            Informe o fornecedor e o valor de cada item.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit, toastFormValidationError)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
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
                  {selectedFornecedor?.nome ?? cotacao?.fornecedor?.nome ?? "-"}
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

          <div className="space-y-3">
            {itensSolicitacao.map((item, index) => {
              const unitario = linhas?.find((linha) => linha.itemId === item.id)?.valorUnitario
              const temValor = typeof unitario === "number" && unitario >= 0.01
              const totalLinha = temValor ? calcValorTotalCotacao(unitario, item.quantidade) : null
              return (
                  <div key={item.id} className="space-y-2 rounded-lg border p-3">
                    <input type="hidden" {...register(`linhas.${index}.itemId`)} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}.</span>
                      {item.descricao}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {COMPRA_CATEGORIA_LABEL[item.categoria]}
                      {" · "}
                      {item.quantidade}
                      {item.unidade ? ` ${item.unidade}` : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`valor-${item.id}`}>
                        Valor unitário<span className="text-destructive ml-0.5 relative top-[2px]">*</span>
                      </Label>
                      <Controller
                        name={`linhas.${index}.valorUnitario`}
                        control={control}
                        render={({ field }) => (
                          <CurrencyInput
                            id={`valor-${item.id}`}
                            allowEmpty
                            value={field.value}
                            onValueChange={field.onChange}
                            aria-invalid={!!errors.linhas?.[index]?.valorUnitario}
                          />
                        )}
                      />
                      {errors.linhas?.[index]?.valorUnitario && (
                        <p className="text-xs text-destructive">
                          {errors.linhas[index]?.valorUnitario?.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Total da linha</Label>
                      <div className="flex h-8 items-center rounded-lg border bg-muted/50 px-2.5 text-sm font-medium tabular-nums">
                        {totalLinha == null ? "-" : brl(totalLinha)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {errors.linhas?.message && (
              <p className="text-xs text-destructive">{errors.linhas.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorTotal">Valor total</Label>
            <div
              id="valorTotal"
              className="flex h-8 items-center rounded-lg border bg-muted/50 px-2.5 text-sm font-medium tabular-nums"
            >
              {valorTotalCalculado == null ? "-" : brl(valorTotalCalculado)}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma das linhas: unitário × quantidade de cada item
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formaPagamento">Forma de pagamento</Label>
            <Input
              id="formaPagamento"
              {...register("formaPagamento")}
              placeholder="Ex: PIX, boleto 30 dias"
            />
          </div>

          </div>
          <DialogFooter className="shrink-0 gap-2 pt-4 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              
              disabled={isSubmitting || itensSolicitacao.length === 0}
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

import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Combobox from "@/components/shared/Combobox"
import CurrencyInput from "@/components/shared/CurrencyInput"
import { useFornecedores } from "@/features/fornecedores/hooks/useFornecedores"
import { toastFormValidationError } from "@/lib/form-utils"
import type {
  CreateOrcamentoManutencaoRequest,
  OrcamentoManutencao,
} from "../types/orcamento-manutencao.types"

const schema = z
  .object({
    fornecedorId: z.string().optional(),
    nomeEmpresa: z.string().optional(),
    nomeContato: z.string().optional(),
    nomeResponsavel: z.string().optional(),
    formaPagamento: z.string().optional(),
    descricaoEscopo: z.string().optional(),
    valor: z.number({ error: "Informe o valor" }).min(0.01, "Valor deve ser maior que zero").optional(),
    prazoExecucaoDias: z.number().int().positive("Prazo deve ser maior que zero").optional(),
    validadeProposta: z.string().optional(),
    garantia: z.string().optional(),
    observacoes: z.string().optional(),
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
    if (data.valor == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o valor",
        path: ["valor"],
      })
    }
  })

type FormData = z.infer<typeof schema>

interface OrcamentoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orcamento?: OrcamentoManutencao
  isSubmitting: boolean
  onSubmit: (data: CreateOrcamentoManutencaoRequest) => void
}

function valoresIniciais(orcamento?: OrcamentoManutencao): FormData {
  return {
    fornecedorId: orcamento?.fornecedor?.id ?? "",
    nomeEmpresa: orcamento?.fornecedor ? "" : (orcamento?.nomeEmpresa ?? ""),
    nomeContato: orcamento?.nomeContato ?? "",
    nomeResponsavel: orcamento?.nomeResponsavel ?? "",
    formaPagamento: orcamento?.formaPagamento ?? "",
    descricaoEscopo: orcamento?.descricaoEscopo ?? "",
    valor: orcamento?.valor,
    prazoExecucaoDias: orcamento?.prazoExecucaoDias,
    validadeProposta: orcamento?.validadeProposta?.slice(0, 10) ?? "",
    garantia: orcamento?.garantia ?? "",
    observacoes: orcamento?.observacoes ?? "",
  }
}

export default function OrcamentoForm({
  open,
  onOpenChange,
  orcamento,
  isSubmitting,
  onSubmit,
}: OrcamentoFormProps) {
  const isEditMode = !!orcamento
  const { data: fornecedoresData } = useFornecedores({ pageSize: 500 })
  const fornecedores = fornecedoresData?.data ?? []
  const fornecedorOptions = [
    { value: "", label: "Nenhum" },
    ...fornecedores.map((fornecedor) => ({ value: fornecedor.id, label: fornecedor.nome })),
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
    defaultValues: valoresIniciais(orcamento),
  })

  const fornecedorId = useWatch({ control, name: "fornecedorId" })
  const hasFornecedor = !!fornecedorId?.trim()
  const selectedFornecedor = fornecedores.find((fornecedor) => fornecedor.id === fornecedorId)

  useEffect(() => {
    if (open) reset(valoresIniciais(orcamento))
  }, [open, orcamento, reset])

  const submit = (data: FormData) => {
    const linked = !!data.fornecedorId?.trim()
    onSubmit({
      fornecedorId: linked ? data.fornecedorId!.trim() : undefined,
      nomeEmpresa: linked ? undefined : data.nomeEmpresa?.trim() || undefined,
      nomeContato: data.nomeContato?.trim() || undefined,
      nomeResponsavel: data.nomeResponsavel?.trim() || undefined,
      formaPagamento: data.formaPagamento?.trim() || undefined,
      descricaoEscopo: data.descricaoEscopo?.trim() || undefined,
      valor: data.valor ?? 0,
      prazoExecucaoDias: data.prazoExecucaoDias,
      validadeProposta: data.validadeProposta?.trim() || undefined,
      garantia: data.garantia?.trim() || undefined,
      observacoes: data.observacoes?.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-4 overflow-hidden sm:max-w-2xl" showCloseButton>
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEditMode ? "Editar orçamento" : "Novo orçamento"}</DialogTitle>
          <DialogDescription>
            Informe o prestador, o valor e as condições da proposta.
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
                      if (id) setValue("nomeEmpresa", "")
                    }}
                    placeholder="Selecione (opcional)"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeEmpresaOrcamento">
                Nome da empresa{" "}
                {!hasFornecedor && (
                  <span className="text-xs text-muted-foreground">(obrigatório se sem fornecedor)</span>
                )}
              </Label>
              {hasFornecedor ? (
                <div className="flex h-8 items-center rounded-lg border border-input bg-muted/50 px-2.5 text-sm text-foreground">
                  {selectedFornecedor?.nome ?? orcamento?.fornecedor?.nome ?? "-"}
                </div>
              ) : (
                <Input id="nomeEmpresaOrcamento" {...register("nomeEmpresa")} placeholder="Ex: Hidráulica Silva" />
              )}
              {errors.nomeEmpresa && (
                <p className="text-xs text-destructive">{errors.nomeEmpresa.message}</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nomeContatoOrcamento">Contato</Label>
                <Input id="nomeContatoOrcamento" {...register("nomeContato")} placeholder="Nome do contato" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomeResponsavelOrcamento">Responsável</Label>
                <Input id="nomeResponsavelOrcamento" {...register("nomeResponsavel")} placeholder="Quem assina a proposta" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valorOrcamento">
                  Valor<span className="relative top-[2px] ml-0.5 text-destructive">*</span>
                </Label>
                <Controller
                  name="valor"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id="valorOrcamento"
                      allowEmpty
                      value={field.value}
                      onValueChange={field.onChange}
                      aria-invalid={!!errors.valor}
                    />
                  )}
                />
                {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="prazoOrcamento">Prazo de execução (dias)</Label>
                <Controller
                  name="prazoExecucaoDias"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="prazoOrcamento"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const raw = event.target.value
                        field.onChange(raw === "" ? undefined : Number(raw))
                      }}
                      placeholder="Ex: 15"
                    />
                  )}
                />
                {errors.prazoExecucaoDias && (
                  <p className="text-xs text-destructive">{errors.prazoExecucaoDias.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="validadeOrcamento">Validade da proposta</Label>
                <Input id="validadeOrcamento" type="date" {...register("validadeProposta")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pagamentoOrcamento">Forma de pagamento</Label>
                <Input id="pagamentoOrcamento" {...register("formaPagamento")} placeholder="Ex: 50% na entrada" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="garantiaOrcamento">Garantia</Label>
              <Input id="garantiaOrcamento" {...register("garantia")} placeholder="Ex: 12 meses" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="escopoOrcamento">Escopo</Label>
              <Textarea
                id="escopoOrcamento"
                {...register("descricaoEscopo")}
                placeholder="O que a proposta cobre"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoesOrcamento">Observações</Label>
              <Textarea id="observacoesOrcamento" {...register("observacoes")} placeholder="Condições adicionais" />
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 pt-4 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Salvar alterações" : "Adicionar orçamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

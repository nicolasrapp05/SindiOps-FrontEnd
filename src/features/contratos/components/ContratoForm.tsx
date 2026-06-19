import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  TIPO_SERVICO_LABEL,
  type Contrato,
  type CreateContratoRequest,
  type TipoServico,
} from "../types/contrato.types"
import { useFornecedores } from "@/features/fornecedores/hooks/useFornecedores"
import { useContrato } from "../hooks/useContratos"
import Combobox from "@/components/shared/Combobox"
import CurrencyInput from "@/components/shared/CurrencyInput"
import { optionalNumber, toastFormValidationError } from "@/lib/form-utils"

const TIPO_SERVICO_OPTIONS = Object.entries(TIPO_SERVICO_LABEL) as [TipoServico, string][]

const tipoServicoSchema = z.enum([
  "administradora",
  "garantidora",
  "gas",
  "telefonia",
  "internet",
  "terceirizada",
  "juridico",
  "manutencao_elevador",
  "manutencao_jardim",
  "gestao_residuos",
  "outro",
])

const contratoSchema = z
  .object({
    fornecedorId: z.string().min(1, "Selecione um fornecedor"),
    tipoServico: tipoServicoSchema,
    nomeContato: z.string().optional(),
    telefoneContato: z.string().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    valorMensal: optionalNumber,
    indiceReajuste: z.string().optional(),
    condicoesRenovacao: z.string().optional(),
    condicoesRescisao: z.string().optional(),
  })
  .refine(
    (d) =>
      d.valorMensal === undefined ||
      (typeof d.valorMensal === "number" &&
        Number.isFinite(d.valorMensal) &&
        d.valorMensal > 0),
    { message: "Valor mensal deve ser maior que zero", path: ["valorMensal"] },
  )

type FormData = z.infer<typeof contratoSchema>

interface ContratoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  condominioId: string
  condominioNome?: string
  contrato?: Contrato | null
  onSubmit: (data: CreateContratoRequest) => void
  isSubmitting: boolean
}

export default function ContratoForm({
  open,
  onOpenChange,
  condominioId,
  condominioNome,
  contrato,
  onSubmit,
  isSubmitting,
}: ContratoFormProps) {
  const isEdit = !!contrato

  const { data: fornecedoresData } = useFornecedores({ pageSize: 500 })
  const fornecedoresList = fornecedoresData?.data ?? []

  // Busca o detalhe do contrato para obter os campos ausentes na listagem
  // (nomeContato, telefoneContato, indiceReajuste, condicoesRenovacao, condicoesRescisao)
  const { data: contratoDetalhe } = useContrato(contrato?.id ?? "")

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      fornecedorId: "",
      tipoServico: "administradora",
      nomeContato: "",
      telefoneContato: "",
      dataInicio: "",
      dataFim: "",
      valorMensal: undefined,
      indiceReajuste: "",
      condicoesRenovacao: "",
      condicoesRescisao: "",
    },
  })

  useEffect(() => {
    if (!open) return

    if (contrato) {
      // Campos disponíveis na listagem: fornecedor, tipoServico, datas, valorMensal.
      // Campos só no detalhe: nomeContato, telefoneContato, indiceReajuste,
      // condicoesRenovacao, condicoesRescisao.
      const src = contratoDetalhe ?? contrato
      reset({
        fornecedorId: contrato.fornecedor.id,
        tipoServico: contrato.tipoServico,
        nomeContato: src.nomeContato ?? "",
        telefoneContato: src.telefoneContato ?? "",
        dataInicio: contrato.dataInicio ?? "",
        dataFim: contrato.dataFim ?? "",
        valorMensal: contrato.valorMensal ?? undefined,
        indiceReajuste: src.indiceReajuste ?? "",
        condicoesRenovacao: src.condicoesRenovacao ?? "",
        condicoesRescisao: src.condicoesRescisao ?? "",
      })
    } else {
      reset({
        fornecedorId: "",
        tipoServico: "administradora",
        nomeContato: "",
        telefoneContato: "",
        dataInicio: "",
        dataFim: "",
        valorMensal: undefined,
        indiceReajuste: "",
        condicoesRenovacao: "",
        condicoesRescisao: "",
      })
    }
  }, [open, contrato, contratoDetalhe, reset])

  const applyFornecedorSelection = (id: string) => {
    if (!id) {
      setValue("nomeContato", "")
      setValue("telefoneContato", "")
      return
    }

    const fornecedor = fornecedoresList.find((f) => f.id === id)
    if (!fornecedor) return

    setValue("nomeContato", fornecedor.nomeContato ?? "")
    setValue("telefoneContato", fornecedor.telefone ?? "")
  }

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      condominioId,
      fornecedorId: data.fornecedorId,
      tipoServico: data.tipoServico,
      nomeContato: data.nomeContato || undefined,
      telefoneContato: data.telefoneContato || undefined,
      dataInicio: data.dataInicio || undefined,
      dataFim: data.dataFim || undefined,
      valorMensal: data.valorMensal ?? undefined,
      indiceReajuste: data.indiceReajuste || undefined,
      condicoesRenovacao: data.condicoesRenovacao || undefined,
      condicoesRescisao: data.condicoesRescisao || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <FileText className="h-5 w-5 text-emerald-700" />
          </div>
          <DialogTitle>{isEdit ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
          <DialogDescription className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Campos marcados com * são obrigatórios
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit, toastFormValidationError)} className="space-y-4 py-2">
          {/* Condomínio (read-only context) */}
          <div className="space-y-1.5">
            <Label>Condomínio</Label>
            <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
              {condominioNome || "—"}
            </div>
          </div>

          {/* Fornecedor */}
          <div className="space-y-1.5">
            <Label>Fornecedor<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
            <Controller
              control={control}
              name="fornecedorId"
              render={({ field }) => (
                <Combobox
                  options={fornecedoresList.map((f) => ({ value: f.id, label: f.nome }))}
                  value={field.value}
                  onValueChange={(id) => {
                    field.onChange(id)
                    applyFornecedorSelection(id)
                  }}
                  placeholder="Buscar fornecedor..."
                />
              )}
            />
            {errors.fornecedorId && (
              <p className="text-xs text-destructive">{errors.fornecedorId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de serviço<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
            <Controller
              control={control}
              name="tipoServico"
              render={({ field }) => (
                <Combobox
                  options={TIPO_SERVICO_OPTIONS.map(([value, label]) => ({ value, label }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecionar tipo de serviço..."
                />
              )}
            />
            {errors.tipoServico && (
              <p className="text-xs text-destructive">{errors.tipoServico.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nomeContato">Nome do contato</Label>
              <Input id="nomeContato" {...register("nomeContato")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefoneContato">Telefone</Label>
              <Input id="telefoneContato" {...register("telefoneContato")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dataInicio">Data de início</Label>
              <Input id="dataInicio" type="date" {...register("dataInicio")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataFim">Data de término</Label>
              <Input id="dataFim" type="date" {...register("dataFim")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="valorMensal">Valor mensal</Label>
            <Controller
              control={control}
              name="valorMensal"
              render={({ field }) => (
                <CurrencyInput
                  id="valorMensal"
                  allowEmpty
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                  aria-invalid={!!errors.valorMensal}
                />
              )}
            />
            {errors.valorMensal && (
              <p className="text-xs text-destructive">{errors.valorMensal.message}</p>
            )}
          </div>

          {/* Índice de reajuste — oculto temporariamente (campo opcional)
          <div className="space-y-1.5">
            <Label htmlFor="indiceReajuste">Índice de reajuste</Label>
            <Input id="indiceReajuste" {...register("indiceReajuste")} />
          </div>
          */}

          <div className="space-y-1.5">
            <Label htmlFor="condicoesRenovacao">Condições de renovação</Label>
            <Textarea id="condicoesRenovacao" rows={3} {...register("condicoesRenovacao")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="condicoesRescisao">Condições de rescisão</Label>
            <Textarea id="condicoesRescisao" rows={3} {...register("condicoesRescisao")} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salvar alterações" : "Cadastrar contrato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

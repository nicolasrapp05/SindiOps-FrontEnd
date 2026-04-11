import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Condominio, CreateCondominioRequest } from "../types/condominio.types"

const optionalDate = z
  .string()
  .refine((v) => !v || !isNaN(Date.parse(v)), "Data inválida")
  .optional()
  .or(z.literal(""))

const condominioSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório"),
  enderecoRua: z.string().optional().or(z.literal("")),
  enderecoNumero: z.string().optional().or(z.literal("")),
  enderecoBairro: z.string().optional().or(z.literal("")),
  enderecoCidade: z.string().optional().or(z.literal("")),
  enderecoCep: z.string().optional().or(z.literal("")),
  dataEleicao: optionalDate,
  vencimentoMandato: optionalDate,
})

type FormData = z.infer<typeof condominioSchema>

interface CondominioFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  condominio?: Condominio | null
  onSubmit: (data: CreateCondominioRequest) => void
  isSubmitting: boolean
}

export default function CondominioForm({
  open,
  onOpenChange,
  condominio,
  onSubmit,
  isSubmitting,
}: CondominioFormProps) {
  const isEdit = !!condominio

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(condominioSchema),
    defaultValues: {
      nome: "",
      enderecoRua: "",
      enderecoNumero: "",
      enderecoBairro: "",
      enderecoCidade: "",
      enderecoCep: "",
      dataEleicao: "",
      vencimentoMandato: "",
    },
  })

  useEffect(() => {
    if (open && condominio) {
      reset({
        nome: condominio.nome,
        enderecoRua: condominio.enderecoRua ?? "",
        enderecoNumero: condominio.enderecoNumero ?? "",
        enderecoBairro: condominio.enderecoBairro ?? "",
        enderecoCidade: condominio.enderecoCidade ?? "",
        enderecoCep: condominio.enderecoCep ?? "",
        dataEleicao: condominio.dataEleicao ?? "",
        vencimentoMandato: condominio.vencimentoMandato ?? "",
      })
    } else if (open) {
      reset({
        nome: "",
        enderecoRua: "",
        enderecoNumero: "",
        enderecoBairro: "",
        enderecoCidade: "",
        enderecoCep: "",
        dataEleicao: "",
        vencimentoMandato: "",
      })
    }
  }, [open, condominio, reset])

  const handleFormSubmit = (data: FormData) => {
    const payload: CreateCondominioRequest = {
      nome: data.nome,
      enderecoRua: data.enderecoRua || undefined,
      enderecoNumero: data.enderecoNumero || undefined,
      enderecoBairro: data.enderecoBairro || undefined,
      enderecoCidade: data.enderecoCidade || undefined,
      enderecoCep: data.enderecoCep || undefined,
      dataEleicao: data.dataEleicao || undefined,
      vencimentoMandato: data.vencimentoMandato || undefined,
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Condomínio" : "Novo Condomínio"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados do condomínio."
              : "Preencha os dados para cadastrar um novo condomínio."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 py-2"
        >
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" placeholder="Ex: Condomínio Jardins" {...register("nome")} />
            {errors.nome && (
              <p className="text-xs text-red-500">{errors.nome.message}</p>
            )}
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="enderecoRua">Rua</Label>
              <Input id="enderecoRua" placeholder="Rua das Flores" {...register("enderecoRua")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enderecoNumero">Número</Label>
              <Input id="enderecoNumero" placeholder="120" {...register("enderecoNumero")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="enderecoBairro">Bairro</Label>
              <Input id="enderecoBairro" placeholder="Jardim América" {...register("enderecoBairro")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enderecoCidade">Cidade</Label>
              <Input id="enderecoCidade" placeholder="São Paulo" {...register("enderecoCidade")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enderecoCep">CEP</Label>
              <Input id="enderecoCep" placeholder="01234-000" {...register("enderecoCep")} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dataEleicao">Data da Eleição</Label>
              <Input id="dataEleicao" type="date" {...register("dataEleicao")} />
              {errors.dataEleicao && (
                <p className="text-xs text-red-500">{errors.dataEleicao.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vencimentoMandato">Vencimento do Mandato</Label>
              <Input id="vencimentoMandato" type="date" {...register("vencimentoMandato")} />
              {errors.vencimentoMandato && (
                <p className="text-xs text-red-500">{errors.vencimentoMandato.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

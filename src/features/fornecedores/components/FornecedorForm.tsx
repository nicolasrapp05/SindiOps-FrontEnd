import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Fornecedor, CreateFornecedorRequest } from "../types/fornecedor.types"
import { useFornecedor } from "../hooks/useFornecedores"

function cnpjMask(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

const servicoSchema = z.object({
  tipo: z.string().min(1, "Tipo obrigatório"),
  descricao: z.string().optional().or(z.literal("")),
  quantidade: z.number().optional(),
})

const formSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório"),
  cnpj: z.string().optional().or(z.literal("")),
  enderecoRua: z.string().optional().or(z.literal("")),
  enderecoNumero: z.string().optional().or(z.literal("")),
  enderecoBairro: z.string().optional().or(z.literal("")),
  enderecoCidade: z.string().optional().or(z.literal("")),
  enderecoCep: z.string().optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  nomeContato: z.string().optional().or(z.literal("")),
  servicos: z.array(servicoSchema),
})

type FormData = z.infer<typeof formSchema>

interface FornecedorFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fornecedor?: Fornecedor | null
  onSubmit: (data: CreateFornecedorRequest) => void
  isSubmitting: boolean
}

export default function FornecedorForm({
  open,
  onOpenChange,
  fornecedor,
  onSubmit,
  isSubmitting,
}: FornecedorFormProps) {
  const isEdit = !!fornecedor

  // Busca o detalhe completo (inclui endereço, instagram, website e serviços,
  // que não vêm na listagem). Desativado quando é criação.
  const { data: fornecedorDetalhe } = useFornecedor(fornecedor?.id ?? "")

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      enderecoRua: "",
      enderecoNumero: "",
      enderecoBairro: "",
      enderecoCidade: "",
      enderecoCep: "",
      telefone: "",
      email: "",
      instagram: "",
      website: "",
      nomeContato: "",
      servicos: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "servicos" })

  useEffect(() => {
    if (!open) return

    if (fornecedor) {
      // Usa o detalhe quando disponível (tem endereço completo, instagram,
      // website e serviços). Enquanto carrega, usa os campos que a listagem
      // já traz (nome, cnpj, telefone, email, nomeContato).
      const src = fornecedorDetalhe ?? fornecedor
      reset({
        nome: fornecedor.nome,
        cnpj: fornecedor.cnpj ?? "",
        enderecoRua: src.enderecoRua ?? "",
        enderecoNumero: src.enderecoNumero ?? "",
        enderecoBairro: src.enderecoBairro ?? "",
        enderecoCidade: src.enderecoCidade ?? "",
        enderecoCep: src.enderecoCep ?? "",
        telefone: fornecedor.telefone ?? "",
        email: fornecedor.email ?? "",
        instagram: src.instagram ?? "",
        website: src.website ?? "",
        nomeContato: fornecedor.nomeContato ?? "",
        servicos: (src.servicos ?? []).map((s) => ({
          tipo: s.tipo,
          descricao: s.descricao ?? "",
          quantidade: s.quantidade,
        })),
      })
    } else {
      reset({
        nome: "", cnpj: "", enderecoRua: "", enderecoNumero: "",
        enderecoBairro: "", enderecoCidade: "", enderecoCep: "",
        telefone: "", email: "", instagram: "", website: "",
        nomeContato: "", servicos: [],
      })
    }
  }, [open, fornecedor, fornecedorDetalhe, reset])

  const cnpjValue = watch("cnpj")

  const handleFormSubmit = (data: FormData) => {
    const payload: CreateFornecedorRequest = {
      nome: data.nome,
      cnpj: data.cnpj || undefined,
      enderecoRua: data.enderecoRua || undefined,
      enderecoNumero: data.enderecoNumero || undefined,
      enderecoBairro: data.enderecoBairro || undefined,
      enderecoCidade: data.enderecoCidade || undefined,
      enderecoCep: data.enderecoCep || undefined,
      telefone: data.telefone || undefined,
      email: data.email || undefined,
      instagram: data.instagram || undefined,
      website: data.website || undefined,
      nomeContato: data.nomeContato || undefined,
      servicos: data.servicos.length
        ? data.servicos.map((s) => ({
            tipo: s.tipo,
            descricao: s.descricao || undefined,
            quantidade: s.quantidade || undefined,
          }))
        : undefined,
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do fornecedor." : "Preencha os dados para cadastrar um novo fornecedor."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          {/* Nome + CNPJ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
              <Input id="nome" placeholder="Razão Social" {...register("nome")} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="XX.XXX.XXX/XXXX-XX"
                value={cnpjValue ?? ""}
                onChange={(e) => setValue("cnpj", cnpjMask(e.target.value))}
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Rua</Label>
              <Input placeholder="Av. Industrial" {...register("enderecoRua")} />
            </div>
            <div className="space-y-1.5">
              <Label>Número</Label>
              <Input placeholder="200" {...register("enderecoNumero")} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Bairro</Label>
              <Input placeholder="Centro" {...register("enderecoBairro")} />
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input placeholder="São Paulo" {...register("enderecoCidade")} />
            </div>
            <div className="space-y-1.5">
              <Label>CEP</Label>
              <Input placeholder="01000-000" {...register("enderecoCep")} />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input placeholder="(11) 3333-4444" {...register("telefone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input placeholder="contato@empresa.com" {...register("email")} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Instagram</Label>
              <Input placeholder="@empresa" {...register("instagram")} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input placeholder="https://..." {...register("website")} />
            </div>
            <div className="space-y-1.5">
              <Label>Contato</Label>
              <Input placeholder="Nome do contato" {...register("nomeContato")} />
            </div>
          </div>

          <Separator />

          {/* Services */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-semibold">Serviços / Produtos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ tipo: "", descricao: "", quantidade: undefined })}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>
            {fields.length === 0 && (
              <p className="text-sm text-gray-400">Nenhum serviço adicionado.</p>
            )}
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-start gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Tipo (ex: limpeza_geral)"
                    {...register(`servicos.${idx}.tipo`)}
                  />
                  <Input
                    className="flex-1"
                    placeholder="Descrição"
                    {...register(`servicos.${idx}.descricao`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-red-500 hover:text-red-700"
                    onClick={() => remove(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
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
              {isEdit ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

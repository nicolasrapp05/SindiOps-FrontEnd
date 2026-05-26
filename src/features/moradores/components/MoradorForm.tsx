import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, UserPlus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getBlocos } from "@/features/condominios/services/condominios.service"
import type { Bloco } from "@/features/condominios/types/condominio.types"
import type { Morador, CreateMoradorRequest } from "../types/morador.types"

function phoneMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const moradorSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório"),
  blocoId: z.string().min(1, "Selecione um bloco"),
  unidadeId: z.string().min(1, "Selecione uma unidade"),
  email: z.string().min(1, "O email é obrigatório").email("Formato de email inválido"),
  telefone: z.string().optional().or(z.literal("")),
})

type FormData = z.infer<typeof moradorSchema>

interface MoradorFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  condominioId: string
  morador?: Morador | null
  onSubmit: (data: CreateMoradorRequest) => void
  isSubmitting: boolean
}

export default function MoradorForm({
  open,
  onOpenChange,
  condominioId,
  morador,
  onSubmit,
  isSubmitting,
}: MoradorFormProps) {
  const isEdit = !!morador
  const [selectedBlocoId, setSelectedBlocoId] = useState("")

  const { data: blocos } = useQuery({
    queryKey: ["condominios", condominioId, "blocos"],
    queryFn: () => getBlocos(condominioId),
    enabled: open && !!condominioId,
  })

  const selectedBloco = blocos?.find((b: Bloco) => b.id === selectedBlocoId)
  const unidades = selectedBloco?.unidades ?? []

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(moradorSchema),
    defaultValues: {
      nome: "",
      blocoId: "",
      unidadeId: "",
      email: "",
      telefone: "",
    },
  })

  useEffect(() => {
    if (open && morador) {
      reset({
        nome: morador.nome,
        blocoId: morador.bloco.id,
        unidadeId: morador.unidade.id,
        email: morador.email,
        telefone: morador.telefone ?? "",
      })
      setSelectedBlocoId(morador.bloco.id)
    } else if (open) {
      reset({ nome: "", blocoId: "", unidadeId: "", email: "", telefone: "" })
      setSelectedBlocoId("")
    }
  }, [open, morador, reset])

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      condominioId,
      unidadeId: data.unidadeId,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <UserPlus className="h-5 w-5 text-emerald-700" />
          </div>
          <DialogTitle>
            {isEdit ? "Editar Morador" : "Cadastrar Novo Morador"}
          </DialogTitle>
          <DialogDescription className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Preencha os dados obrigatórios
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input id="nome" placeholder="Ex: João da Silva" {...register("nome")} />
            {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
          </div>

          {/* Bloco + Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bloco *</Label>
              <Controller
                control={control}
                name="blocoId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val)
                      setSelectedBlocoId(val)
                      setValue("unidadeId", "")
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {blocos?.map((b: Bloco) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.blocoId && <p className="text-xs text-red-500">{errors.blocoId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Unidade *</Label>
              <Controller
                control={control}
                name="unidadeId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!selectedBlocoId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.numero}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.unidadeId && <p className="text-xs text-red-500">{errors.unidadeId.message}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" placeholder="morador@email.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone</Label>
            <Controller
              control={control}
              name="telefone"
              render={({ field }) => (
                <Input
                  id="telefone"
                  placeholder="(11) 99999-0000"
                  value={field.value}
                  onChange={(e) => field.onChange(phoneMask(e.target.value))}
                />
              )}
            />
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
              {isEdit ? "Salvar Alterações" : "Cadastrar Morador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

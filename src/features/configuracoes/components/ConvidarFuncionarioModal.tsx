import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, UserPlus } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CARGO_LABEL,
  type ConvidarFuncionarioRequest,
  type FuncionarioCargo,
} from "../types/funcionario.types"

const schema = z.object({
  nome: z.string().min(1, "O nome é obrigatório"),
  email: z.string().min(1, "O email é obrigatório").email("Formato de email inválido"),
  cargo: z.enum(["zelador", "secretario", "porteiro", "outro"]),
})

type FormData = z.infer<typeof schema>

const CARGOS: FuncionarioCargo[] = ["zelador", "secretario", "porteiro", "outro"]

interface ConvidarFuncionarioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ConvidarFuncionarioRequest) => void
  isSubmitting: boolean
}

export default function ConvidarFuncionarioModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: ConvidarFuncionarioModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      email: "",
      cargo: "zelador",
    },
  })

  useEffect(() => {
    if (open) {
      reset({ nome: "", email: "", cargo: "zelador" })
    }
  }, [open, reset])

  const submit = (data: FormData) => {
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <UserPlus className="h-6 w-6" />
          </div>
        </div>
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle>Convidar Funcionário</DialogTitle>
          <DialogDescription>
            Envie um convite por email para adicionar um novo membro à equipe do condomínio.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          O funcionário terá acesso apenas aos módulos permitidos para o cargo selecionado.
        </div>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="convite-nome">Nome<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
            <Input id="convite-nome" {...register("nome")} placeholder="Nome completo" />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="convite-email">Email<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
            <Input
              id="convite-email"
              type="email"
              {...register("email")}
              placeholder="email@exemplo.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Cargo<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
            <Controller
              name="cargo"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARGOS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CARGO_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cargo && <p className="text-xs text-destructive">{errors.cargo.message}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

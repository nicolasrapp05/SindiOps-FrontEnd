import { useEffect, useMemo } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"
import Combobox from "@/components/shared/Combobox"
import MultiCombobox from "@/components/shared/MultiCombobox"
import { useCondominios } from "@/features/condominios/hooks/useCondominios"
import {
  CARGO_LABEL,
  type ConvidarFuncionarioRequest,
  type FuncionarioCargo,
} from "../types/funcionario.types"
import { toastFormValidationError } from "@/lib/form-utils"

const schema = z.object({
  nome: z.string().min(1, "O nome é obrigatório"),
  email: z.string().min(1, "O email é obrigatório").email("Formato de email inválido"),
  cargo: z.enum(["zelador", "secretario", "porteiro", "outro"]),
  condominioIds: z.array(z.string()).min(1, "Selecione ao menos um condomínio"),
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
  const { data: condominios, isLoading: condominiosLoading } = useCondominios()

  const condominioOptions = useMemo(
    () => (condominios ?? []).map((c) => ({ value: c.id, label: c.nome })),
    [condominios],
  )

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
      condominioIds: [],
    },
  })

  useEffect(() => {
    if (open) {
      reset({ nome: "", email: "", cargo: "zelador", condominioIds: [] })
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
            Envie um convite por email e defina os condomínios que o funcionário poderá acessar.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          O funcionário terá acesso apenas aos condomínios selecionados e aos módulos permitidos
          para o cargo.
        </div>
        <form onSubmit={handleSubmit(submit, toastFormValidationError)} className="space-y-4">
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
                <Combobox
                  options={CARGOS.map((c) => ({ value: c, label: CARGO_LABEL[c] }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecionar cargo..."
                />
              )}
            />
            {errors.cargo && <p className="text-xs text-destructive">{errors.cargo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Condomínios<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
            {condominiosLoading ? (
              <Skeleton className="h-8 w-full rounded-lg" />
            ) : condominioOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cadastre um condomínio antes de convidar funcionários.
              </p>
            ) : (
              <Controller
                name="condominioIds"
                control={control}
                render={({ field }) => (
                  <MultiCombobox
                    options={condominioOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Selecionar condomínios..."
                    emptyText="Nenhum condomínio encontrado"
                  />
                )}
              />
            )}
            {errors.condominioIds && (
              <p className="text-xs text-destructive">{errors.condominioIds.message}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting || condominioOptions.length === 0}
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

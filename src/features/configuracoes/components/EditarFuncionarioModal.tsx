import { useEffect, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Pencil } from "lucide-react"
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
  type Funcionario,
  type FuncionarioCargo,
  type UpdateFuncionarioRequest,
} from "../types/funcionario.types"
import { toastFormValidationError } from "@/lib/form-utils"
import { toast } from "sonner"

const schema = z.object({
  nome: z.string().min(1, "O nome é obrigatório"),
  cargo: z.enum(["zelador", "secretario", "porteiro", "outro"]),
  condominioIds: z.array(z.string()).min(1, "Selecione ao menos um condomínio"),
})

type FormData = z.infer<typeof schema>

const CARGOS: FuncionarioCargo[] = ["zelador", "secretario", "porteiro", "outro"]

interface EditarFuncionarioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  funcionario: Funcionario | null
  onSubmit: (data: UpdateFuncionarioRequest) => void
  isSubmitting: boolean
}

export default function EditarFuncionarioModal({
  open,
  onOpenChange,
  funcionario,
  onSubmit,
  isSubmitting,
}: EditarFuncionarioModalProps) {
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
      cargo: "zelador",
      condominioIds: [],
    },
  })

  useEffect(() => {
    if (open && funcionario) {
      reset({
        nome: funcionario.nome,
        cargo: funcionario.cargo,
        condominioIds: funcionario.condominios?.map((c) => c.id) ?? [],
      })
    }
  }, [open, funcionario, reset])

  const submit = (data: FormData) => {
    if (condominioOptions.length === 0) {
      toast.error("Cadastre ao menos um condomínio antes de editar funcionários.")
      return
    }
    if (data.condominioIds.length === 0) {
      toast.error("Selecione ao menos um condomínio para o funcionário.")
      return
    }
    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Pencil className="h-6 w-6" />
          </div>
        </div>
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle>Editar Funcionário</DialogTitle>
          <DialogDescription>
            Atualize nome, cargo e condomínios de acesso. O email não pode ser alterado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit, toastFormValidationError)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editar-nome">Nome<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
            <Input id="editar-nome" {...register("nome")} placeholder="Nome completo" />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="editar-email">Email</Label>
            <Input
              id="editar-email"
              type="email"
              value={funcionario?.email ?? ""}
              disabled
              className="bg-muted"
            />
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
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Cadastre ao menos um condomínio antes de editar funcionários.
              </div>
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
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

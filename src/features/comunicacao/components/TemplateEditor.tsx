import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  TEMPLATE_TIPO_LABEL,
  VARIAVEIS_DISPONIVEIS,
  type CreateTemplateRequest,
  type EmailTemplate,
  type TemplateTipo,
} from "../types/template.types"

const TIPO_VALUES: [TemplateTipo, ...TemplateTipo[]] = [
  "advertencia",
  "multa",
  "notificacao_ocorrencia",
  "comunicado_geral",
  "notificacao_manutencao",
]

const formSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório"),
  tipo: z.enum(TIPO_VALUES),
  assunto: z.string().min(1, "O assunto é obrigatório"),
  corpo: z.string().min(1, "O corpo é obrigatório"),
})

type FormData = z.infer<typeof formSchema>

interface TemplateEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: EmailTemplate | null
  onSubmit: (data: CreateTemplateRequest) => void
  isSubmitting: boolean
}

const defaultValues: FormData = {
  nome: "",
  tipo: "advertencia",
  assunto: "",
  corpo: "",
}

export function TemplateEditor({
  open,
  onOpenChange,
  template,
  onSubmit,
  isSubmitting,
}: TemplateEditorProps) {
  const isEdit = !!template

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const corpoWatch = watch("corpo")

  useEffect(() => {
    if (!open) return
    if (template) {
      reset({
        nome: template.nome,
        tipo: template.tipo,
        assunto: template.assunto,
        corpo: template.corpo,
      })
    } else {
      reset(defaultValues)
    }
  }, [open, template, reset])

  function appendToken(token: string) {
    const current = getValues("corpo") ?? ""
    setValue("corpo", current + token, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,calc(100%-2rem))] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar template" : "Novo template"}</DialogTitle>
          <DialogDescription>
            Defina nome, tipo, assunto e corpo do e-mail. Use variáveis entre chaves duplas onde
            indicado.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) =>
            onSubmit({
              nome: data.nome,
              tipo: data.tipo,
              assunto: data.assunto,
              corpo: data.corpo,
            }),
          )}
          className="space-y-4"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_min(220px,100%)] lg:items-start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-nome">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input id="template-nome" placeholder="Ex.: Multa estacionamento" {...register("nome")} />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Tipo <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPO_VALUES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TEMPLATE_TIPO_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.tipo && (
                  <p className="text-xs text-destructive">{errors.tipo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-assunto">
                  Assunto <span className="text-destructive">*</span>
                </Label>
                <Input id="template-assunto" placeholder="Assunto do e-mail" {...register("assunto")} />
                {errors.assunto && (
                  <p className="text-xs text-destructive">{errors.assunto.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-corpo">
                  Corpo <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="corpo"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      id="template-corpo"
                      placeholder="Texto do e-mail..."
                      rows={14}
                      className="min-h-[220px] resize-y font-mono text-sm"
                      {...field}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Você pode inserir tokens como{" "}
                  <code className="rounded bg-muted px-1 py-0.5">{"{{nome_morador}}"}</code> — clique
                  nas variáveis ao lado para adicionar ao corpo.
                  {corpoWatch != null && corpoWatch.length > 0 && (
                    <span className="ml-1">({corpoWatch.length} caracteres)</span>
                  )}
                </p>
                {errors.corpo && (
                  <p className="text-xs text-destructive">{errors.corpo.message}</p>
                )}
              </div>
            </div>

            <div
              className={cn(
                "rounded-lg border bg-muted/30 p-3",
                "lg:sticky lg:top-0 lg:max-h-[min(420px,50vh)] lg:overflow-y-auto",
              )}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Variáveis disponíveis
              </p>
              <ul className="flex flex-col gap-2">
                {VARIAVEIS_DISPONIVEIS.map((v) => (
                  <li key={v.token}>
                    <button
                      type="button"
                      onClick={() => appendToken(v.token)}
                      className="flex w-full flex-col items-start gap-0.5 rounded-md border border-transparent bg-background/80 p-2 text-left text-xs transition-colors hover:border-border hover:bg-background"
                    >
                      <Badge variant="secondary" className="max-w-full truncate font-mono text-[10px]">
                        {v.token}
                      </Badge>
                      <span className="text-muted-foreground">{v.descricao}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isEdit ? (
                "Salvar alterações"
              ) : (
                "Criar template"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Info, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import TokenTextarea, { type TokenDef, type TokenTextareaHandle } from "@/components/shared/TokenTextarea"
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
import { get } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

const TOKEN_DEFS: TokenDef[] = VARIAVEIS_DISPONIVEIS.map((v) => ({
  token: v.token,
  label: v.descricao,
}))

export function TemplateEditor({
  open,
  onOpenChange,
  template,
  onSubmit,
  isSubmitting,
}: TemplateEditorProps) {
  const isEdit = !!template
  const tokenTextareaRef = useRef<TokenTextareaHandle>(null)

  const { data: templateDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["email-template-detail", template?.id],
    queryFn: () => get<{ corpo: string; assunto: string }>(`/email-templates/${template!.id}`),
    enabled: open && !!template?.id,
    staleTime: 0,
  })

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const corpoWatch = watch("corpo")

  useEffect(() => {
    if (!open) return
    if (template && templateDetail) {
      reset({
        nome: template.nome,
        tipo: template.tipo,
        assunto: templateDetail.assunto ?? template.assunto,
        corpo: templateDetail.corpo ?? "",
      })
    } else if (!template) {
      reset(defaultValues)
    }
  }, [open, template, templateDetail, reset])

  function appendToken(token: string, label: string) {
    tokenTextareaRef.current?.insertToken(token, label)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,calc(100%-2rem))] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar template" : "Novo template"}</DialogTitle>
          <DialogDescription>
            Defina nome, tipo, assunto e corpo do e-mail. Clique nas variáveis ao lado para
            inseri-las no corpo.
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
                  Nome<span className="text-destructive ml-0.5 relative top-[2px]">*</span>
                </Label>
                <Input
                  id="template-nome"
                  placeholder="Ex.: Multa estacionamento"
                  {...register("nome")}
                />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Tipo<span className="text-destructive ml-0.5 relative top-[2px]">*</span>
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
                  Assunto<span className="text-destructive ml-0.5 relative top-[2px]">*</span>
                </Label>
                <Input
                  id="template-assunto"
                  placeholder="Assunto do e-mail"
                  {...register("assunto")}
                />
                {errors.assunto && (
                  <p className="text-xs text-destructive">{errors.assunto.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-corpo">
                  Corpo<span className="text-destructive ml-0.5 relative top-[2px]">*</span>
                </Label>
                <Controller
                  name="corpo"
                  control={control}
                  render={({ field }) => (
                    <TokenTextarea
                      ref={tokenTextareaRef}
                      value={field.value}
                      onChange={field.onChange}
                      tokens={TOKEN_DEFS}
                      placeholder="Texto do e-mail..."
                      minRows={12}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Clique nas variáveis ao lado para inserir no ponto do cursor.
                  {corpoWatch != null && corpoWatch.length > 0 && (
                    <span className="ml-1">({corpoWatch.length} caracteres)</span>
                  )}
                </p>
                {errors.corpo && (
                  <p className="text-xs text-destructive">{errors.corpo.message}</p>
                )}
              </div>
            </div>

            {/* Variables sidebar */}
            <div
              className={cn(
                "rounded-lg border bg-muted/30 p-3",
                "lg:sticky lg:top-0 lg:max-h-[min(480px,60vh)] lg:overflow-y-auto",
              )}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Variáveis disponíveis
              </p>
              <ul className="flex flex-col gap-1">
                {VARIAVEIS_DISPONIVEIS.map((v) => (
                  <li key={v.token} className="flex items-center gap-1">
                    {/* Click to insert */}
                    <button
                      type="button"
                      onClick={() => appendToken(v.token, v.descricao)}
                      className={cn(
                        "min-w-0 flex-1 cursor-pointer rounded-md border border-transparent px-2 py-1.5 text-left text-xs transition-colors",
                        "hover:border-border hover:bg-background",
                        "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      )}
                    >
                      <span className="token-chip pointer-events-none">{v.descricao}</span>
                    </button>

                    {/* Info tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          role="img"
                          aria-label="Informações sobre esta variável"
                          className={cn(
                            "flex size-5 shrink-0 cursor-default items-center justify-center rounded-full",
                            "text-muted-foreground/60 transition-colors hover:text-muted-foreground",
                          )}
                        >
                          <Info className="size-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[200px]">
                        <p className="font-medium text-foreground">{v.descricao}</p>
                        <p className="mt-0.5 text-muted-foreground">{v.fonte}</p>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (isEdit && isLoadingDetail)}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              {isSubmitting || (isEdit && isLoadingDetail) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLoadingDetail ? "Carregando..." : "Salvando..."}
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

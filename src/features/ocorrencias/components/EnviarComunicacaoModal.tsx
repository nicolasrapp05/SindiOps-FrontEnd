import { useState, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  FileText,
  AlertCircle,
  Send,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CurrencyInput from "@/components/shared/CurrencyInput"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import TokenTextarea, { type TokenDef, type TokenTextareaHandle } from "@/components/shared/TokenTextarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { get } from "@/lib/api"
import { VARIAVEIS_DISPONIVEIS } from "@/features/comunicacao/types/template.types"
import { useEnviarComunicacao } from "../hooks/useOcorrencias"

// List endpoint — no corpo
interface EmailTemplate {
  id: string
  nome: string
  tipo: string
  assunto: string
}

// Detail endpoint — includes corpo
interface EmailTemplateDetail extends EmailTemplate {
  corpo: string
}

const TOKEN_DEFS: TokenDef[] = VARIAVEIS_DISPONIVEIS.map((v) => ({
  token: v.token,
  label: v.descricao,
}))

const TOKENS_REQUIRING_INPUT = ["{{valor_multa}}", "{{prazo_resposta}}"] as const

interface MoradorInfo {
  id: string; nome: string; email: string; unidade: string; bloco: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  ocorrenciaId: string
  moradorPadrao?: MoradorInfo
  templateTipoPadrao?: string
}

export default function EnviarComunicacaoModal({
  open, onOpenChange, ocorrenciaId, moradorPadrao, templateTipoPadrao,
}: Props) {
  const [step, setStep] = useState(1)
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [assunto, setAssunto] = useState("")
  const [corpo, setCorpo] = useState("")
  const [valorMulta, setValorMulta] = useState<number | undefined>()
  const [prazoResposta, setPrazoResposta] = useState("")

  const tokenTextareaRef = useRef<TokenTextareaHandle>(null)

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: templates } = useQuery({
    queryKey: ["email-templates", templateTipoPadrao],
    queryFn: () =>
      get<EmailTemplate[]>(
        "/email-templates",
        templateTipoPadrao ? { tipo: templateTipoPadrao } : undefined,
      ),
    enabled: open,
  })

  // Fetches full detail (including corpo) as soon as a template is selected
  const { data: templateDetail, isFetching: isLoadingDetail } = useQuery({
    queryKey: ["email-templates", "detail", selectedTemplateId],
    queryFn: () => get<EmailTemplateDetail>(`/email-templates/${selectedTemplateId}`),
    enabled: !!selectedTemplateId,
    staleTime: 0,
  })

  const enviarMutation = useEnviarComunicacao()

  const resetFormState = () => {
    setStep(1)
    setSelectedTemplateId("")
    setAssunto("")
    setCorpo("")
    setValorMulta(undefined)
    setPrazoResposta("")
  }

  const resetBodyFields = () => {
    setAssunto("")
    setCorpo("")
    setValorMulta(undefined)
    setPrazoResposta("")
  }

  const handleOpenChange = (next: boolean) => {
    if (next) {
      resetFormState()
    }
    onOpenChange(next)
  }

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
    resetBodyFields()
  }

  const handleGoToStep3 = () => {
    if (templateDetail) {
      setAssunto(templateDetail.assunto)
      setCorpo(templateDetail.corpo)
    }
    setStep(3)
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId)

  // Tokens whose values are provided via dedicated input fields — resolved by backend
  const inputProvidedTokens: Record<string, boolean> = {
    "{{valor_multa}}": valorMulta != null && valorMulta > 0,
    "{{prazo_resposta}}": !!prazoResposta,
  }
  const unresolvedVars = TOKENS_REQUIRING_INPUT.filter(
    (v) => corpo.includes(v) && !inputProvidedTokens[v],
  )
  const canSend = !unresolvedVars.length && !!assunto.trim() && !!corpo.trim() && !!moradorPadrao

  const showPrazoField = !!templateDetail?.corpo.includes("{{prazo_resposta}}")

  function appendToken(token: string, label: string) {
    tokenTextareaRef.current?.insertToken(token, label)
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSend = () => {
    if (!moradorPadrao || !selectedTemplateId) return
    enviarMutation.mutate(
      {
        ocorrenciaId,
        data: {
          templateId: selectedTemplateId,
          moradorId: moradorPadrao.id,
          assuntoEditado: assunto,
          corpoEditado: corpo,
          ...(valorMulta != null && valorMulta > 0 ? { valorMulta } : {}),
          ...(prazoResposta ? { prazoResposta } : {}),
        },
      },
      { onSuccess: () => handleOpenChange(false) },
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar Comunicação</DialogTitle>
          <DialogDescription>
            Etapa {step} de 3 —{" "}
            {step === 1 ? "Selecione o Template" : step === 2 ? "Destinatário" : "Revisar e Editar"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex gap-2 pb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition",
                s <= step ? "bg-emerald-500" : "bg-gray-200",
              )}
            />
          ))}
        </div>

        {/* STEP 1: Template selection */}
        {step === 1 && (
          <div className="space-y-3">
            {!templates?.length ? (
              <p className="py-8 text-center text-sm text-gray-400">Nenhum template encontrado.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-4 text-left transition",
                      selectedTemplateId === t.id
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                        : "hover:border-gray-300",
                    )}
                    onClick={() => handleSelectTemplate(t.id)}
                  >
                    <div className="mt-0.5 rounded-lg bg-gray-100 p-2">
                      {t.tipo === "multa" ? <AlertCircle className="h-4 w-4 text-red-500" /> :
                       t.tipo === "advertencia" ? <AlertTriangle className="h-4 w-4 text-amber-500" /> :
                       <FileText className="h-4 w-4 text-blue-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{t.nome}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">{t.tipo}</Badge>
                    </div>
                    {selectedTemplateId === t.id && (
                      <Check className="h-5 w-5 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button
                disabled={!selectedTemplateId || isLoadingDetail}
                onClick={() => setStep(2)}
              >
                {isLoadingDetail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Próximo <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Recipient */}
        {step === 2 && (
          <div className="space-y-4">
            {moradorPadrao ? (
              <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {moradorPadrao.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{moradorPadrao.nome}</p>
                  <p className="text-xs text-gray-500">
                    {moradorPadrao.bloco} · Apt {moradorPadrao.unidade} · {moradorPadrao.email}
                  </p>
                </div>
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-400">
                Nenhum morador vinculado a esta ocorrência.
              </p>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
              <Button disabled={!moradorPadrao} onClick={handleGoToStep3}>
                Próximo <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Edit */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_min(220px,100%)] lg:items-start">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Assunto</Label>
                  <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Corpo do Email</Label>
                  <TokenTextarea
                    key={`${selectedTemplateId}-${templateDetail ? "ready" : "loading"}`}
                    ref={tokenTextareaRef}
                    value={corpo}
                    onChange={setCorpo}
                    tokens={TOKEN_DEFS}
                    placeholder="Texto do e-mail..."
                    minRows={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Clique nas variáveis ao lado para inserir no ponto do cursor.
                  </p>
                </div>

                {selectedTemplate?.tipo === "multa" && (
                  <div className="space-y-1.5">
                    <Label>Valor da multa</Label>
                    <CurrencyInput
                      allowEmpty
                      value={valorMulta}
                      onValueChange={setValorMulta}
                    />
                  </div>
                )}

                {showPrazoField && (
                  <div className="space-y-1.5">
                    <Label>
                      Prazo para resposta
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        — substitui{" "}
                        <span className="token-chip !mx-0 !py-0 text-[10px]">Prazo para resposta</span>
                        {" "}no corpo
                      </span>
                    </Label>
                    <Input
                      type="date"
                      value={prazoResposta}
                      onChange={(e) => setPrazoResposta(e.target.value)}
                    />
                    {prazoResposta && (
                      <p className="text-xs text-muted-foreground">
                        Será enviado como:{" "}
                        <strong>{prazoResposta.split("-").reverse().join("/")}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>

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
                  {VARIAVEIS_DISPONIVEIS.map((v) => {
                    const needsInput = TOKENS_REQUIRING_INPUT.includes(
                      v.token as (typeof TOKENS_REQUIRING_INPUT)[number],
                    )
                    const missingInput = needsInput && corpo.includes(v.token) && !inputProvidedTokens[v.token]

                    return (
                      <li key={v.token} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => appendToken(v.token, v.descricao)}
                          className={cn(
                            "min-w-0 flex-1 cursor-pointer rounded-md border border-transparent px-2 py-1.5 text-left text-xs transition-colors",
                            "hover:border-border hover:bg-background",
                            "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                            missingInput && "border-orange-200 bg-orange-50/80 hover:bg-orange-50",
                          )}
                        >
                          <span className={cn("token-chip pointer-events-none", missingInput && "ring-1 ring-orange-300")}>
                            {missingInput && (
                              <AlertTriangle className="mr-1 inline h-3 w-3 text-orange-600" />
                            )}
                            {v.descricao}
                          </span>
                        </button>
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
                    )
                  })}
                </ul>
              </div>
            </div>

            {unresolvedVars.length > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Preencha os campos obrigatórios das variáveis destacadas antes de enviar.
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
              <Button
                disabled={!canSend || enviarMutation.isPending}
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={handleSend}
              >
                {enviarMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar Comunicação
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

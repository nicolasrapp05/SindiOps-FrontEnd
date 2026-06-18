import { useState, useEffect } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CurrencyInput from "@/components/shared/CurrencyInput"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { get } from "@/lib/api"
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

const VARIAVEIS = [
  "{{nome_morador}}", "{{unidade}}", "{{bloco}}", "{{condominio}}",
  "{{data_ocorrencia}}", "{{descricao_ocorrencia}}", "{{tipo_ocorrencia}}",
  "{{nome_sindico}}", "{{valor_multa}}", "{{data_envio}}", "{{prazo_resposta}}",
]

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
    queryKey: ["email-template", selectedTemplateId],
    queryFn: () => get<EmailTemplateDetail>(`/email-templates/${selectedTemplateId}`),
    enabled: !!selectedTemplateId,
    staleTime: 5 * 60 * 1000,
  })

  const enviarMutation = useEnviarComunicacao()

  // ── Effects ────────────────────────────────────────────────────────────────

  // Reset everything when modal opens
  useEffect(() => {
    if (open) {
      setStep(1)
      setSelectedTemplateId("")
      setAssunto("")
      setCorpo("")
      setValorMulta(undefined)
      setPrazoResposta("")
    }
  }, [open])

  // Reset body fields when the selected template changes
  useEffect(() => {
    setAssunto("")
    setCorpo("")
    setValorMulta(undefined)
    setPrazoResposta("")
  }, [selectedTemplateId])

  // Pre-fill assunto and corpo once the detail arrives
  useEffect(() => {
    if (!templateDetail) return
    setAssunto(templateDetail.assunto)
    let body = templateDetail.corpo
    if (moradorPadrao) {
      body = body.replace(/\{\{nome_morador\}\}/g, moradorPadrao.nome)
      body = body.replace(/\{\{unidade\}\}/g, moradorPadrao.unidade)
      body = body.replace(/\{\{bloco\}\}/g, moradorPadrao.bloco)
    }
    setCorpo(body)
  }, [templateDetail, moradorPadrao])

  // ── Derived state ──────────────────────────────────────────────────────────

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId)

  // Tokens whose values are provided via dedicated input fields — resolved by backend
  const inputProvidedTokens: Record<string, boolean> = {
    "{{valor_multa}}": valorMulta != null && valorMulta > 0,
    "{{prazo_resposta}}": !!prazoResposta,
  }
  const unresolvedVars = VARIAVEIS.filter((v) => corpo.includes(v) && !inputProvidedTokens[v])
  const canSend = !unresolvedVars.length && !!assunto.trim() && !!corpo.trim() && !!moradorPadrao

  const showPrazoField = !!templateDetail?.corpo.includes("{{prazo_resposta}}")

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
      { onSuccess: () => onOpenChange(false) },
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    onClick={() => setSelectedTemplateId(t.id)}
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
              <Button disabled={!moradorPadrao} onClick={() => setStep(3)}>
                Próximo <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Edit */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Assunto</Label>
              <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Corpo do Email</Label>
              <Textarea rows={10} value={corpo} onChange={(e) => setCorpo(e.target.value)} />
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

            {/* Variable chips panel */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
                Variáveis Disponíveis
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VARIAVEIS.map((v) => {
                  const unresolved = corpo.includes(v)
                  return (
                    <button
                      key={v}
                      className={cn(
                        "rounded-md px-2 py-1 text-xs font-medium transition",
                        unresolved
                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100",
                      )}
                      onClick={() => setCorpo((prev) => prev + " " + v)}
                    >
                      {unresolved && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                      {v}
                    </button>
                  )
                })}
              </div>
            </div>

            {unresolvedVars.length > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Preencha todas as variáveis destacadas antes de enviar.
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

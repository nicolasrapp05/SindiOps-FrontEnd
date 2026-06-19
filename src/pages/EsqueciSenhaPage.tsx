import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router-dom"
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react"
import { RECOVERY_OTP_MAX_LENGTH, RECOVERY_OTP_MIN_LENGTH } from "@/lib/auth-password"
import { getApiErrorMessage } from "@/lib/api"
import { toastFormValidationError } from "@/lib/form-utils"
import { useAuth } from "@/hooks/useAuth"
import AuthShell from "@/components/shared/AuthShell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const schema = z.object({
  email: z
    .string()
    .min(1, "O email é obrigatório")
    .email("Formato de email inválido"),
})

type FormData = z.infer<typeof schema>

export default function EsqueciSenhaPage() {
  const { requestPasswordReset } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (data: FormData) => {
    setSubmitError(null)
    try {
      await requestPasswordReset(data.email)
      setSentEmail(data.email)
      setSent(true)
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Erro ao enviar email de recuperação"))
    }
  }

  return (
    <AuthShell
      title="Esqueci minha senha"
      subtitle="Informe seu email e enviaremos um link para redefinir sua senha."
      footer={
        <p className="text-center text-sm text-gray-500">
          <Link to="/login" className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao login
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
            <div className="space-y-2 text-sm text-emerald-950">
              <p className="font-medium">Verifique sua caixa de entrada</p>
              <p className="leading-relaxed text-emerald-900/80">
                Se existir uma conta com <strong>{sentEmail}</strong>, você receberá um
                email com um código numérico ({RECOVERY_OTP_MIN_LENGTH} a {RECOVERY_OTP_MAX_LENGTH} dígitos).
                Acesse{" "}
                <Link to="/redefinir-senha" className="font-medium underline">
                  Redefinir senha
                </Link>{" "}
                e informe o código. Não use emails de solicitações anteriores.
              </p>
              <p className="text-xs text-emerald-800/70">
                Verifique também a pasta de spam. Emails de recuperação podem ser
                filtrados até o domínio de envio estar totalmente verificado.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit, toastFormValidationError)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="pl-10"
                autoFocus
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {submitError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {submitError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-700 hover:bg-emerald-800"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Enviar link de recuperação
          </Button>
        </form>
      )}
    </AuthShell>
  )
}

import type { ReactNode } from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router-dom"
import { ArrowLeft, Loader2, Lock, AlertCircle, KeyRound, Mail, CheckCircle2 } from "lucide-react"
import { RECOVERY_OTP_MAX_LENGTH, RECOVERY_OTP_MIN_LENGTH } from "@/lib/auth-password"
import { getApiErrorMessage } from "@/lib/api"
import { toastFormValidationError } from "@/lib/form-utils"
import { useAuth } from "@/hooks/useAuth"
import { useRecoverySession } from "@/features/auth/hooks/useRecoverySession"
import AuthShell from "@/components/shared/AuthShell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const passwordFields = {
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmarSenha: z.string().min(1, "Confirme a senha"),
}

const passwordSchema = z
  .object(passwordFields)
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  })

const otpSchema = z
  .object({
    email: z
      .string()
      .min(1, "O email é obrigatório")
      .email("Formato de email inválido"),
    codigo: z
      .string()
      .min(
        RECOVERY_OTP_MIN_LENGTH,
        `Informe o código de ${RECOVERY_OTP_MIN_LENGTH} a ${RECOVERY_OTP_MAX_LENGTH} dígitos`,
      )
      .max(RECOVERY_OTP_MAX_LENGTH, `O código tem no máximo ${RECOVERY_OTP_MAX_LENGTH} dígitos`)
      .regex(/^\d+$/, "Use apenas números"),
    ...passwordFields,
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  })

type PasswordFormData = z.infer<typeof passwordSchema>
type OtpFormData = z.infer<typeof otpSchema>

export type PasswordRecoveryCopy = {
  loadingTitle: string
  loadingSubtitle: string
  invalidTitle: string
  invalidSubtitle: string
  invalidAlert: string
  invalidFooter?: ReactNode
  otpSectionTitle: string
  otpSectionHint: string
  otpCodeLabel: string
  otpSubmitLabel: string
  otpErrorFallback: string
  passwordErrorFallback: string
  readyTitle: string
  readySubtitle: string
  passwordLabel: string
  confirmPasswordLabel: string
  readySubmitLabel: string
  successShellTitle: string
  successShellSubtitle: string
  successHeading: string
  successMessage: string
  successButtonLabel: string
}

type PasswordRecoveryFlowProps = {
  copy: PasswordRecoveryCopy
}

export default function PasswordRecoveryFlow({ copy }: PasswordRecoveryFlowProps) {
  const { completePasswordRecovery, verifyRecoveryOtp } = useAuth()
  const { status: recoveryStatus, errorMessage } = useRecoverySession()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [otpSubmitError, setOtpSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { senha: "", confirmarSenha: "" },
  })

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: "", codigo: "", senha: "", confirmarSenha: "" },
  })

  const onSubmitPassword = async (data: PasswordFormData) => {
    setSubmitError(null)
    try {
      await completePasswordRecovery(data.senha)
      setSuccess(true)
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, copy.passwordErrorFallback))
    }
  }

  const onSubmitOtp = async (data: OtpFormData) => {
    setOtpSubmitError(null)
    try {
      await verifyRecoveryOtp(data.email, data.codigo)
      await completePasswordRecovery(data.senha)
      setSuccess(true)
    } catch (err) {
      setOtpSubmitError(getApiErrorMessage(err, copy.otpErrorFallback))
    }
  }

  if (success) {
    return (
      <AuthShell title={copy.successShellTitle} subtitle={copy.successShellSubtitle}>
        <div className="space-y-5">
          <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div className="space-y-2 text-sm text-emerald-950">
                <p className="font-medium">{copy.successHeading}</p>
                <p className="leading-relaxed text-emerald-900/80">{copy.successMessage}</p>
              </div>
            </div>
          </div>

          <Button asChild className="w-full bg-emerald-700 hover:bg-emerald-800">
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {copy.successButtonLabel}
            </Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  if (recoveryStatus === "loading") {
    return (
      <AuthShell title={copy.loadingTitle} subtitle={copy.loadingSubtitle}>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </AuthShell>
    )
  }

  if (recoveryStatus === "invalid") {
    return (
      <AuthShell
        title={copy.invalidTitle}
        subtitle={copy.invalidSubtitle}
        footer={copy.invalidFooter}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="space-y-1 leading-relaxed">
              <p>{copy.invalidAlert}</p>
              {errorMessage && (
                <p className="text-xs text-amber-800/80">{errorMessage}</p>
              )}
            </div>
          </div>

          <form
            onSubmit={otpForm.handleSubmit(onSubmitOtp, toastFormValidationError)}
            className="space-y-4 rounded-lg border border-gray-200 bg-gray-50/60 p-4"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">{copy.otpSectionTitle}</p>
              <p className="text-xs text-gray-500">{copy.otpSectionHint}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recovery-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="recovery-email"
                  type="email"
                  placeholder="seu@email.com"
                  className="bg-white pl-10"
                  {...otpForm.register("email")}
                />
              </div>
              {otpForm.formState.errors.email && (
                <p className="text-xs text-red-500">{otpForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recovery-codigo">{copy.otpCodeLabel}</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="recovery-codigo"
                  inputMode="numeric"
                  maxLength={RECOVERY_OTP_MAX_LENGTH}
                  placeholder="00000000"
                  className="bg-white pl-10 tracking-widest"
                  {...otpForm.register("codigo")}
                />
              </div>
              {otpForm.formState.errors.codigo && (
                <p className="text-xs text-red-500">{otpForm.formState.errors.codigo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recovery-senha">{copy.passwordLabel}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="recovery-senha"
                  type="password"
                  placeholder="••••••"
                  className="bg-white pl-10"
                  {...otpForm.register("senha")}
                />
              </div>
              {otpForm.formState.errors.senha && (
                <p className="text-xs text-red-500">{otpForm.formState.errors.senha.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recovery-confirmar">{copy.confirmPasswordLabel}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="recovery-confirmar"
                  type="password"
                  placeholder="••••••"
                  className="bg-white pl-10"
                  {...otpForm.register("confirmarSenha")}
                />
              </div>
              {otpForm.formState.errors.confirmarSenha && (
                <p className="text-xs text-red-500">
                  {otpForm.formState.errors.confirmarSenha.message}
                </p>
              )}
            </div>

            {otpSubmitError && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {otpSubmitError}
              </div>
            )}

            <Button
              type="submit"
              disabled={otpForm.formState.isSubmitting}
              className="w-full bg-emerald-700 hover:bg-emerald-800"
            >
              {otpForm.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              {copy.otpSubmitLabel}
            </Button>
          </form>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={copy.readyTitle}
      subtitle={copy.readySubtitle}
      footer={
        <p className="text-center text-sm text-gray-500">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao login
          </Link>
        </p>
      }
    >
      <form
        onSubmit={passwordForm.handleSubmit(onSubmitPassword, toastFormValidationError)}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="recovery-ready-senha">{copy.passwordLabel}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="recovery-ready-senha"
              type="password"
              placeholder="••••••"
              className="pl-10"
              autoFocus
              {...passwordForm.register("senha")}
            />
          </div>
          {passwordForm.formState.errors.senha && (
            <p className="text-xs text-red-500">{passwordForm.formState.errors.senha.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="recovery-ready-confirmar">{copy.confirmPasswordLabel}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="recovery-ready-confirmar"
              type="password"
              placeholder="••••••"
              className="pl-10"
              {...passwordForm.register("confirmarSenha")}
            />
          </div>
          {passwordForm.formState.errors.confirmarSenha && (
            <p className="text-xs text-red-500">
              {passwordForm.formState.errors.confirmarSenha.message}
            </p>
          )}
        </div>

        {submitError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</div>
        )}

        <Button
          type="submit"
          disabled={passwordForm.formState.isSubmitting}
          className="w-full bg-emerald-700 hover:bg-emerald-800"
        >
          {passwordForm.formState.isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          {copy.readySubmitLabel}
        </Button>
      </form>
    </AuthShell>
  )
}

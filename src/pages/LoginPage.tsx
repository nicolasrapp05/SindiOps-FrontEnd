import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Loader2, Mail, ArrowRight } from "lucide-react"
import { getApiErrorMessage } from "@/lib/api"
import { toastFormValidationError } from "@/lib/form-utils"
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/store/auth-store"
import AuthShell from "@/components/shared/AuthShell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import PasswordField from "@/components/shared/PasswordField"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "O email é obrigatório")
    .email("Formato de email inválido"),
  password: z
    .string()
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || "/dashboard"

  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (data: LoginForm) => {
    setSubmitError(null)
    try {
      await login(data.email, data.password)
      navigate(from, { replace: true })
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Erro ao realizar login"))
    }
  }

  return (
    <AuthShell
      title="Entrar na sua conta"
      subtitle="Use o e-mail e a senha da sua conta."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link
            to="/cadastro"
            className="rounded-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cadastre-se como síndico
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit, toastFormValidationError)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="seu@email.com"
              className="pl-10"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Senha</Label>
            <Link
              to="/esqueci-senha"
              className="rounded-sm text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Esqueci minha senha
            </Link>
          </div>
          <PasswordField
            id="password"
            autoComplete="current-password"
            placeholder="Mínimo de 6 caracteres"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {submitError && (
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="h-10 w-full">
          {isSubmitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="mr-2 size-4" aria-hidden="true" />
          )}
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  )
}

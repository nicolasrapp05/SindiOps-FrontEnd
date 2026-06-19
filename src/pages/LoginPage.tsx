import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react"
import { getApiErrorMessage } from "@/lib/api"
import { toastFormValidationError } from "@/lib/form-utils"
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/store/auth-store"
import AuthShell from "@/components/shared/AuthShell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

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
      subtitle="Bem-vindo de volta! Por favor, insira seus dados."
      footer={
        <p className="text-center text-sm text-gray-500">
          Não tem conta?{" "}
          <Link to="/cadastro" className="font-medium text-emerald-700 hover:underline">
            Cadastre-se como síndico
          </Link>
        </p>
      }
    >
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
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              to="/esqueci-senha"
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              className="pl-10"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">
              {errors.password.message}
            </p>
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
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Entrar
        </Button>
      </form>
    </AuthShell>
  )
}

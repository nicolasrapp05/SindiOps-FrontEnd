import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { Building, Loader2, Mail, Lock, ArrowRight } from "lucide-react"
import { getApiErrorMessage } from "@/lib/api"
import { toastFormValidationError } from "@/lib/form-utils"
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/store/auth-store"
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
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden flex-col justify-between bg-[#0f1b14] p-10 text-white lg:flex lg:w-1/2">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
            <Building className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">SíndiOps</span>
        </div>

        {/* Headline */}
        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Gestão condominial inteligente
          </h1>
          <p className="mt-4 text-lg text-white/60">
            Centralize tudo. Do portão ao relatório.
          </p>
        </div>

        {/* Social proof */}
        <p className="text-sm text-white/40">
          Feito para síndicos que levam a{" "}
          <span className="font-semibold text-emerald-400">gestão a sério</span>
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Building className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">SíndiOps</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Entrar na sua conta
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Bem-vindo de volta! Por favor, insira seus dados.
          </p>

          <form onSubmit={handleSubmit(onSubmit, toastFormValidationError)} className="mt-8 space-y-5">
            {/* Email */}
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

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <a
                  href="#"
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  Esqueci minha senha
                </a>
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

            {/* Submit error */}
            {submitError && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {submitError}
              </div>
            )}

            {/* Button */}
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

          <p className="mt-8 text-center text-sm text-gray-500">
            Não tem conta?{" "}
            <span className="font-medium text-gray-700">
              Fale com o administrador
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

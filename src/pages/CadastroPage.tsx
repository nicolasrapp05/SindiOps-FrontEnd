import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react"
import { getApiErrorMessage } from "@/lib/api"
import { toastFormValidationError } from "@/lib/form-utils"
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/store/auth-store"
import { cadastroSindico } from "@/features/auth/services/auth.service"
import AuthShell from "@/components/shared/AuthShell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const cadastroSchema = z
  .object({
    nome: z
      .string()
      .min(1, "O nome é obrigatório")
      .max(200, "Nome deve ter no máximo 200 caracteres"),
    email: z
      .string()
      .min(1, "O email é obrigatório")
      .email("Formato de email inválido"),
    senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmarSenha: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  })

type CadastroForm = z.infer<typeof cadastroSchema>

export default function CadastroPage() {
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
  } = useForm<CadastroForm>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { nome: "", email: "", senha: "", confirmarSenha: "" },
  })

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (data: CadastroForm) => {
    setSubmitError(null)
    try {
      await cadastroSindico(data)
      await login(data.email, data.senha)
      navigate(from, { replace: true })
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Erro ao criar conta"))
    }
  }

  return (
    <AuthShell
      title="Criar conta de síndico"
      subtitle="Cadastre-se para gerenciar seus condomínios no SíndiOps."
      footer={
        <p className="text-center text-sm text-gray-500">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-emerald-700 hover:underline">
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit, toastFormValidationError)} className="space-y-5">
        <div className="rounded-md border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 text-xs leading-relaxed text-emerald-900">
          Esta página é exclusiva para <strong>síndicos</strong>. Membros da equipe
          (zelador, secretário, porteiro) entram apenas por convite.
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="nome"
              placeholder="Seu nome"
              className="pl-10"
              {...register("nome")}
            />
          </div>
          {errors.nome && (
            <p className="text-xs text-red-500">{errors.nome.message}</p>
          )}
        </div>

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
          <Label htmlFor="senha">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="senha"
              type="password"
              placeholder="••••••"
              className="pl-10"
              {...register("senha")}
            />
          </div>
          {errors.senha && (
            <p className="text-xs text-red-500">{errors.senha.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmarSenha">Confirmar senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="confirmarSenha"
              type="password"
              placeholder="••••••"
              className="pl-10"
              {...register("confirmarSenha")}
            />
          </div>
          {errors.confirmarSenha && (
            <p className="text-xs text-red-500">{errors.confirmarSenha.message}</p>
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
          Criar conta
        </Button>
      </form>
    </AuthShell>
  )
}

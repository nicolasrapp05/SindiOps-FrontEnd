import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Loader2, Mail, User, ArrowRight } from "lucide-react"
import { getApiErrorMessage } from "@/lib/api"
import { toastFormValidationError } from "@/lib/form-utils"
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/store/auth-store"
import { cadastroSindico } from "@/features/auth/services/auth.service"
import AuthShell from "@/components/shared/AuthShell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import PasswordField from "@/components/shared/PasswordField"

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
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link
            to="/login"
            className="rounded-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
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
            <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="nome"
              autoComplete="name"
              placeholder="Seu nome"
              className="pl-10"
              aria-invalid={errors.nome ? true : undefined}
              aria-describedby={errors.nome ? "nome-error" : undefined}
              {...register("nome")}
            />
          </div>
          {errors.nome && (
            <p id="nome-error" className="text-xs text-destructive">{errors.nome.message}</p>
          )}
        </div>

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
          <Label htmlFor="senha">Senha</Label>
          <PasswordField
            id="senha"
            autoComplete="new-password"
            placeholder="Mínimo de 6 caracteres"
            aria-invalid={errors.senha ? true : undefined}
            aria-describedby={errors.senha ? "senha-error" : undefined}
            {...register("senha")}
          />
          {errors.senha && (
            <p id="senha-error" className="text-xs text-destructive">{errors.senha.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmarSenha">Confirmar senha</Label>
          <PasswordField
            id="confirmarSenha"
            autoComplete="new-password"
            placeholder="Repita a senha"
            aria-invalid={errors.confirmarSenha ? true : undefined}
            aria-describedby={errors.confirmarSenha ? "confirmar-senha-error" : undefined}
            {...register("confirmarSenha")}
          />
          {errors.confirmarSenha && (
            <p id="confirmar-senha-error" className="text-xs text-destructive">{errors.confirmarSenha.message}</p>
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
          {isSubmitting ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>
    </AuthShell>
  )
}

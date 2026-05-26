import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, KeyRound, Mail, Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/auth-store"
import {
  useAtualizarPerfil,
  useAlterarSenha,
} from "@/features/configuracoes/hooks/usePerfil"
import type { UserCargo } from "@/types"

// ─── helpers ─────────────────────────────────────────────────────────────────

function initials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return nome.slice(0, 2).toUpperCase() || "?"
}

const CARGO_LABEL: Record<UserCargo, string> = {
  sindico: "Síndico",
  secretario: "Secretário(a)",
  zelador: "Zelador",
  porteiro: "Porteiro",
}

// ─── schemas ─────────────────────────────────────────────────────────────────

const editarPerfilSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
})

const alterarSenhaSchema = z
  .object({
    novaSenha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmarSenha: z.string(),
  })
  .refine((v) => v.novaSenha === v.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  })

type EditarPerfilForm = z.infer<typeof editarPerfilSchema>
type AlterarSenhaForm = z.infer<typeof alterarSenhaSchema>

// ─── component ───────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const user = useAuthStore((s) => s.user)
  const atualizarPerfil = useAtualizarPerfil()
  const alterarSenha = useAlterarSenha()

  const [showNova, setShowNova] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)

  const perfilForm = useForm<EditarPerfilForm>({
    resolver: zodResolver(editarPerfilSchema),
    defaultValues: { nome: user?.nome ?? "" },
  })

  const senhaForm = useForm<AlterarSenhaForm>({
    resolver: zodResolver(alterarSenhaSchema),
    defaultValues: { novaSenha: "", confirmarSenha: "" },
  })

  const onSubmitPerfil = (values: EditarPerfilForm) => {
    atualizarPerfil.mutate(values.nome, {
      onSuccess: () => perfilForm.reset({ nome: values.nome }),
    })
  }

  const onSubmitSenha = (values: AlterarSenhaForm) => {
    alterarSenha.mutate(values.novaSenha, {
      onSuccess: () => senhaForm.reset(),
    })
  }

  const cargo = user?.cargo ?? "sindico"
  const nome = user?.nome ?? ""
  const email = user?.email ?? ""

  return (
    <div className="space-y-6">
      {/* ── page header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Perfil</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie suas informações pessoais e segurança da conta.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── left: identity card ── */}
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center">
              <Avatar className="h-20 w-20 text-lg">
                <AvatarFallback className="bg-emerald-100 text-xl font-bold text-emerald-700">
                  {nome ? initials(nome) : "?"}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <p className="text-lg font-semibold text-gray-900">
                  {nome || "—"}
                </p>
                <p className="text-sm text-gray-500">{email}</p>
              </div>

              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                {CARGO_LABEL[cargo]}
              </span>
            </div>

            <hr className="my-5 border-gray-100" />

            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-gray-600">
                <User className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate">{nome || "—"}</span>
              </li>
              <li className="flex items-center gap-2.5 text-gray-600">
                <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate">{email}</span>
              </li>
              <li className="flex items-center gap-2.5 text-gray-600">
                <Shield className="h-4 w-4 shrink-0 text-gray-400" />
                <span>{CARGO_LABEL[cargo]}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── right: forms ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* ── edit profile ── */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-gray-900">
                Informações do Perfil
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Atualize seu nome de exibição.
              </p>
            </div>

            <form onSubmit={perfilForm.handleSubmit(onSubmitPerfil)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  placeholder="Seu nome"
                  {...perfilForm.register("nome")}
                />
                {perfilForm.formState.errors.nome && (
                  <p className="text-xs text-red-500">
                    {perfilForm.formState.errors.nome.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email-ro">Email</Label>
                <Input
                  id="email-ro"
                  value={email}
                  readOnly
                  disabled
                  className="cursor-not-allowed bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400">
                  O email é gerenciado pelo sistema e não pode ser alterado aqui.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cargo-ro">Cargo</Label>
                <Input
                  id="cargo-ro"
                  value={CARGO_LABEL[cargo]}
                  readOnly
                  disabled
                  className="cursor-not-allowed bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400">
                  O cargo é atribuído pelo síndico responsável.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={
                    atualizarPerfil.isPending ||
                    !perfilForm.formState.isDirty
                  }
                >
                  {atualizarPerfil.isPending ? "Salvando…" : "Salvar alterações"}
                </Button>
              </div>
            </form>
          </div>

          {/* ── change password ── */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-amber-50 p-2">
                <KeyRound className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Segurança</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Defina uma nova senha para sua conta.
                </p>
              </div>
            </div>

            <form onSubmit={senhaForm.handleSubmit(onSubmitSenha)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="novaSenha">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="novaSenha"
                    type={showNova ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-10"
                    {...senhaForm.register("novaSenha")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNova((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showNova ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {senhaForm.formState.errors.novaSenha && (
                  <p className="text-xs text-red-500">
                    {senhaForm.formState.errors.novaSenha.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirmarSenha"
                    type={showConfirmar ? "text" : "password"}
                    placeholder="Repita a nova senha"
                    className="pr-10"
                    {...senhaForm.register("confirmarSenha")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmar((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirmar ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {senhaForm.formState.errors.confirmarSenha && (
                  <p className="text-xs text-red-500">
                    {senhaForm.formState.errors.confirmarSenha.message}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={alterarSenha.isPending}
                >
                  {alterarSenha.isPending ? "Alterando…" : "Alterar senha"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

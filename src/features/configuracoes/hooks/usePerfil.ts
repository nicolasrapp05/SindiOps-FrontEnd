import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import { authUserFromPerfil } from "@/lib/auth-user"
import { supabaseClient } from "@/lib/supabase"
import { updatePerfil } from "../services/perfil.service"
import { useAuthStore } from "@/store/auth-store"

export function useAtualizarPerfil() {
  return useMutation({
    mutationFn: async (nome: string) => {
      const perfil = await updatePerfil({ nome })
      await supabaseClient.auth.refreshSession()
      return perfil
    },
    onSuccess: (perfil) => {
      useAuthStore.setState({ user: authUserFromPerfil(perfil) })
      toast.success("Perfil atualizado com sucesso")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao atualizar perfil")),
  })
}

export function useAlterarSenha() {
  return useMutation({
    mutationFn: async (novaSenha: string) => {
      const { error } = await supabaseClient.auth.updateUser({ password: novaSenha })
      if (error) throw error
    },
    onSuccess: () => toast.success("Senha alterada com sucesso"),
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao alterar senha")),
  })
}

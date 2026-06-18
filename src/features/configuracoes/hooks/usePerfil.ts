import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import { supabaseClient } from "@/lib/supabase"
import { useAuthStore } from "@/store/auth-store"

export function useAtualizarPerfil() {
  return useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabaseClient.auth.updateUser({
        data: { nome },
      })
      if (error) throw error
      return data.user
    },
    onSuccess: (supabaseUser) => {
      if (supabaseUser) {
        const meta = supabaseUser.user_metadata
        useAuthStore.setState((state) => ({
          user: state.user
            ? { ...state.user, nome: (meta?.nome as string) ?? state.user.nome }
            : state.user,
        }))
      }
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

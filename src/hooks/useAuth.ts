import { supabaseClient } from "@/lib/supabase"
import { useAuthStore } from "@/store/auth-store"
import type { AuthUser } from "@/types"

export function useAuth() {
  const { user, isAuthenticated, setSession, clearSession } = useAuthStore()

  const login = async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.session) throw new Error("Sessão não retornada")

    const meta = data.session.user.user_metadata
    const authUser: AuthUser = {
      id: data.session.user.id,
      email: data.session.user.email ?? "",
      nome: (meta?.nome as string) ?? "",
      cargo: (meta?.cargo as AuthUser["cargo"]) ?? "sindico",
    }

    setSession(authUser, data.session.access_token, data.session.refresh_token)
  }

  const logout = async () => {
    await supabaseClient.auth.signOut()
    clearSession()
  }

  const cargo = user?.cargo ?? null

  return { user, isAuthenticated, cargo, login, logout }
}

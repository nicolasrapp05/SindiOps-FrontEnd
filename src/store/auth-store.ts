import { create } from "zustand"
import { supabaseClient, isSupabaseConfigured } from "@/lib/supabase"
import { authUserFromPerfil, authUserFromSupabase } from "@/lib/auth-user"
import type { AuthUser } from "@/types"

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setSession: (user: AuthUser, token: string, refreshToken: string) => void
  clearSession: () => void
  initSession: () => Promise<void>
  hydrateUserFromApi: () => Promise<void>
}

const REFRESH_TOKEN_KEY = "sindiops_refresh_token"

async function fetchPerfilFromApi() {
  const { getPerfil } = await import("@/features/configuracoes/services/perfil.service")
  return getPerfil()
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: (user, token, refreshToken) => {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    set({ user, accessToken: token, isAuthenticated: true })
  },

  clearSession: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  hydrateUserFromApi: async () => {
    if (!get().accessToken) return
    try {
      const perfil = await fetchPerfilFromApi()
      set({ user: authUserFromPerfil(perfil) })
    } catch {
      /* mantém dados da sessão Supabase como fallback */
    }
  },

  initSession: async () => {
    if (!isSupabaseConfigured) {
      set({ isLoading: false })
      return
    }
    set({ isLoading: true })
    try {
      const { data } = await supabaseClient.auth.getSession()
      if (data.session) {
        const user = authUserFromSupabase(data.session.user)
        set({
          user,
          accessToken: data.session.access_token,
          isAuthenticated: true,
        })
        await get().hydrateUserFromApi()
      }
    } catch {
      /* session inválida — permanece deslogado */
    } finally {
      set({ isLoading: false })
    }
  },
}))

import { create } from "zustand"
import { supabaseClient, isSupabaseConfigured } from "@/lib/supabase"
import type { AuthUser } from "@/types"

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setSession: (user: AuthUser, token: string, refreshToken: string) => void
  clearSession: () => void
  initSession: () => Promise<void>
}

const REFRESH_TOKEN_KEY = "sindiops_refresh_token"

export const useAuthStore = create<AuthState>((set) => ({
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

  initSession: async () => {
    if (!isSupabaseConfigured) {
      set({ isLoading: false })
      return
    }
    set({ isLoading: true })
    try {
      const { data } = await supabaseClient.auth.getSession()
      if (data.session) {
        const meta = data.session.user.user_metadata
        set({
          user: {
            id: data.session.user.id,
            email: data.session.user.email ?? "",
            nome: (meta?.nome as string) ?? "",
            cargo: (meta?.cargo as AuthUser["cargo"]) ?? "sindico",
          },
          accessToken: data.session.access_token,
          isAuthenticated: true,
        })
      }
    } catch {
      /* session inválida — permanece deslogado */
    } finally {
      set({ isLoading: false })
    }
  },
}))

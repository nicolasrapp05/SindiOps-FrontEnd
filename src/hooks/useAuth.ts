import { supabaseClient } from "@/lib/supabase"
import { authUserFromSupabase } from "@/lib/auth-user"
import { useAuthStore } from "@/store/auth-store"
import {
  requestPasswordReset as requestPasswordResetApi,
  updatePassword as updatePasswordApi,
  verifyRecoveryOtp as verifyRecoveryOtpApi,
} from "@/features/auth/services/auth-password.service"
import type { AuthUser } from "@/types"

export function useAuth() {
  const { user, isAuthenticated, setSession, clearSession, hydrateUserFromApi } = useAuthStore()

  const login = async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.session) throw new Error("Sessão não retornada")

    const authUser: AuthUser = authUserFromSupabase(data.session.user)

    setSession(authUser, data.session.access_token, data.session.refresh_token)
    await hydrateUserFromApi()
  }

  const requestPasswordReset = async (email: string) => {
    await requestPasswordResetApi(email)
  }

  const verifyRecoveryOtp = async (email: string, token: string) => {
    await verifyRecoveryOtpApi(email, token)
  }

  const completePasswordRecovery = async (newPassword: string) => {
    await updatePasswordApi(newPassword)
    await supabaseClient.auth.signOut()
    clearSession()
  }

  const logout = async () => {
    await supabaseClient.auth.signOut()
    clearSession()
  }

  const cargo = user?.cargo ?? null

  return {
    user,
    isAuthenticated,
    cargo,
    login,
    logout,
    requestPasswordReset,
    verifyRecoveryOtp,
    completePasswordRecovery,
  }
}

import { useEffect, useState } from "react"
import { supabaseClient } from "@/lib/supabase"
import { establishRecoverySession } from "@/features/auth/services/auth-password.service"
import { hasPasswordRecoveryParams } from "@/lib/auth-password"

export type RecoverySessionStatus = "loading" | "ready" | "invalid"

export function useRecoverySession() {
  const [status, setStatus] = useState<RecoverySessionStatus>(() =>
    hasPasswordRecoveryParams() ? "loading" : "invalid",
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!hasPasswordRecoveryParams()) return

    let cancelled = false

    void (async () => {
      const result = await establishRecoverySession()
      if (cancelled) return

      if (result.ok) {
        setStatus("ready")
        setErrorMessage(null)
        return
      }

      setStatus("invalid")
      setErrorMessage(result.error ?? "Não foi possível validar o link de recuperação.")
    })()

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setStatus("ready")
        setErrorMessage(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return { status, errorMessage }
}

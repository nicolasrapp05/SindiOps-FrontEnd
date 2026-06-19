import type { EmailOtpType } from "@supabase/supabase-js"
import { supabaseClient } from "@/lib/supabase"
import {
  cleanRecoveryUrl,
  getAuthCallbackError,
  hasPasswordRecoveryParams,
} from "@/lib/auth-password"
import { esqueciSenha } from "@/features/auth/services/auth.service"

function getHashParams() {
  const raw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash
  return new URLSearchParams(raw)
}

function waitForRecoveryAuthEvent(timeoutMs: number) {
  return new Promise<{ ok: boolean; error?: string }>((resolve) => {
    let settled = false

    const finish = (result: { ok: boolean; error?: string }) => {
      if (settled) return
      settled = true
      subscription.unsubscribe()
      window.clearTimeout(timer)
      resolve(result)
    }

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        finish({ ok: true })
      }
    })

    const timer = window.setTimeout(() => {
      finish({ ok: false, error: "Tempo esgotado ao validar o link." })
    }, timeoutMs)
  })
}

export async function requestPasswordReset(email: string) {
  await esqueciSenha({ email: email.trim() })
}

export async function establishRecoverySession(): Promise<{ ok: boolean; error?: string }> {
  if (!hasPasswordRecoveryParams()) {
    return { ok: false, error: "Nenhum link de recuperação detectado." }
  }

  const callbackError = getAuthCallbackError()
  if (callbackError) return { ok: false, error: callbackError }

  const search = new URLSearchParams(window.location.search)
  const hash = getHashParams()

  const tokenHash = search.get("token_hash") ?? hash.get("token_hash")
  const type = (search.get("type") ?? hash.get("type")) as EmailOtpType | null
  if (tokenHash && type === "recovery") {
    const { error } = await supabaseClient.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    })
    if (error) return { ok: false, error: error.message }
    cleanRecoveryUrl()
    return { ok: true }
  }

  const code = search.get("code")
  if (code) {
    const { error } = await supabaseClient.auth.exchangeCodeForSession(code)
    if (!error) {
      cleanRecoveryUrl()
      return { ok: true }
    }
  }

  if (hash.get("access_token") && hash.get("type") === "recovery") {
    const eventResult = await waitForRecoveryAuthEvent(8000)
    if (eventResult.ok) {
      cleanRecoveryUrl()
      return { ok: true }
    }
  }

  const eventResult = await waitForRecoveryAuthEvent(8000)
  if (eventResult.ok) {
    cleanRecoveryUrl()
    return { ok: true }
  }

  const { data: { session }, error } = await supabaseClient.auth.getSession()
  if (error) return { ok: false, error: error.message }
  if (session) {
    cleanRecoveryUrl()
    return { ok: true }
  }

  return { ok: false, error: eventResult.error ?? "Link inválido ou expirado." }
}

export async function verifyRecoveryOtp(email: string, token: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedToken = token.trim().replace(/\s/g, "")

  const { error } = await supabaseClient.auth.verifyOtp({
    email: normalizedEmail,
    token: normalizedToken,
    type: "recovery",
  })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabaseClient.auth.updateUser({ password: newPassword })
  if (error) throw error
}

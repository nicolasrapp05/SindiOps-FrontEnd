/** Supabase Auth envia OTP de recuperação com 6 a 8 dígitos. */
export const RECOVERY_OTP_MIN_LENGTH = 6
export const RECOVERY_OTP_MAX_LENGTH = 8

export function getPasswordResetRedirectUrl() {
  if (import.meta.env.DEV) {
    return `${window.location.origin}/redefinir-senha`
  }

  const base = import.meta.env.VITE_APP_URL || window.location.origin
  return `${String(base).replace(/\/$/, "")}/redefinir-senha`
}

function getHashParams() {
  const raw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash
  return new URLSearchParams(raw)
}

export function getAuthCallbackError() {
  if (typeof window === "undefined") return null

  const search = new URLSearchParams(window.location.search)
  const hash = getHashParams()
  const error = search.get("error") ?? hash.get("error")
  if (!error) return null

  const description = search.get("error_description") ?? hash.get("error_description")
  return description?.replace(/\+/g, " ") ?? error
}

export function hasPasswordRecoveryParams() {
  if (typeof window === "undefined") return false

  const search = new URLSearchParams(window.location.search)
  const hash = getHashParams()

  if (search.get("type") === "recovery" || hash.get("type") === "recovery") return true
  if (search.has("code") || search.has("token_hash")) return true
  if (hash.has("access_token") && hash.get("type") === "recovery") return true

  return false
}

export function cleanRecoveryUrl() {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  url.search = ""
  url.hash = ""
  window.history.replaceState({}, "", url.pathname)
}

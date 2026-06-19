import type { User } from "@supabase/supabase-js"
import type { AuthUser, UserCargo } from "@/types"

export function resolveNomeFromMetadata(meta: Record<string, unknown> | undefined): string {
  if (!meta) return ""
  const nome = meta.nome
  if (typeof nome === "string" && nome.trim()) return nome
  const fullName = meta.full_name
  if (typeof fullName === "string" && fullName.trim()) return fullName
  return ""
}

export function resolveCargoFromMetadata(
  meta: Record<string, unknown> | undefined,
): UserCargo {
  const cargo = meta?.cargo
  if (
    cargo === "sindico" ||
    cargo === "secretario" ||
    cargo === "zelador" ||
    cargo === "porteiro"
  ) {
    return cargo
  }
  return "sindico"
}

export function authUserFromSupabase(user: User): AuthUser {
  const meta = user.user_metadata as Record<string, unknown> | undefined
  return {
    id: user.id,
    email: user.email ?? "",
    nome: resolveNomeFromMetadata(meta),
    cargo: resolveCargoFromMetadata(meta),
  }
}

export function authUserFromPerfil(
  perfil: { id: string; nome: string; email: string; cargo: string },
): AuthUser {
  return {
    id: perfil.id,
    email: perfil.email,
    nome: perfil.nome,
    cargo: resolveCargoFromMetadata({ cargo: perfil.cargo }),
  }
}

import { get, patch } from "@/lib/api"
import type { Perfil, UpdatePerfilRequest } from "../types/perfil.types"

export function getPerfil() {
  return get<Perfil>("/perfil/me")
}

export function updatePerfil(data: UpdatePerfilRequest) {
  return patch<Perfil>("/perfil/me", data)
}

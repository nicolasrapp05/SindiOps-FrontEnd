import type { UserCargo } from "@/types"

export interface Perfil {
  id: string
  nome: string
  email: string
  cargo: UserCargo | "outro"
}

export interface UpdatePerfilRequest {
  nome: string
}

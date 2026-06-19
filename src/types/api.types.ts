export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
  errors: ApiError[] | null
}

export interface ApiError {
  field: string
  message: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  nextCursor: string | null
  totalCount: number
  pageSize: number
}

export type UserCargo = "sindico" | "secretario" | "zelador" | "porteiro"

export const USER_CARGO_LABEL: Record<UserCargo | "outro", string> = {
  sindico: "Síndico",
  secretario: "Secretário(a)",
  zelador: "Zelador",
  porteiro: "Porteiro",
  outro: "Outro",
}

export function formatCargoLabel(cargo: string | null | undefined): string {
  if (!cargo) return ""
  return USER_CARGO_LABEL[cargo as UserCargo | "outro"] ?? cargo
}

export interface AuthUser {
  id: string
  email: string
  nome: string
  cargo: UserCargo
}

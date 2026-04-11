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

export interface AuthUser {
  id: string
  email: string
  nome: string
  cargo: UserCargo
}

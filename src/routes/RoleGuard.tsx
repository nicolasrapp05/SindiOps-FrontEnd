import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/store/auth-store"
import type { UserCargo } from "@/types"
import { isAllowedCargo } from "@/lib/cargo-permissions"
import { toast } from "sonner"

interface RoleGuardProps {
  allowedRoles: UserCargo[]
}

export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const cargo = useAuthStore((s) => s.user?.cargo)

  if (!cargo || !isAllowedCargo(cargo, allowedRoles)) {
    toast.warning("Você não tem permissão para acessar esta página.")
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

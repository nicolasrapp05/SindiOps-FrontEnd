import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/store/auth-store"
import type { UserCargo } from "@/types"
import { toast } from "sonner"

interface RoleGuardProps {
  allowedRoles: UserCargo[]
}

export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const cargo = useAuthStore((s) => s.user?.cargo)

  if (!cargo || !allowedRoles.includes(cargo)) {
    toast.warning("Você não tem permissão para acessar esta página.")
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

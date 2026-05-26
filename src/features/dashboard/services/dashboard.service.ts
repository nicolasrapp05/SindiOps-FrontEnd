import { get } from "@/lib/api"
import type { DashboardData } from "../types/dashboard.types"

export function getDashboard(condominioId?: string): Promise<DashboardData> {
  return get<DashboardData>("/dashboard", condominioId ? { condominioId } : undefined)
}

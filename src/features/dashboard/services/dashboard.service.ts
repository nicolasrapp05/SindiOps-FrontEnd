import { get } from "@/lib/api"
import type { DashboardData, DashboardQuery } from "../types/dashboard.types"

export function getDashboard(query?: DashboardQuery): Promise<DashboardData> {
  return get<DashboardData>("/dashboard", query)
}

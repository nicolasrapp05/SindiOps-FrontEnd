import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getDashboard } from "../services/dashboard.service"
import type { DashboardQuery } from "../types/dashboard.types"

export function useDashboard(query?: DashboardQuery) {
  return useQuery({
    queryKey: ["dashboard", query],
    queryFn: () => getDashboard(query),
    placeholderData: keepPreviousData,
    staleTime: 0,
  })
}

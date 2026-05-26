import { useQuery } from "@tanstack/react-query"
import { getDashboard } from "../services/dashboard.service"

export function useDashboard(condominioId?: string) {
  return useQuery({
    queryKey: ["dashboard", condominioId],
    queryFn: () => getDashboard(condominioId),
  })
}

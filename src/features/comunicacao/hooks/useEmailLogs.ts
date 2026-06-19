import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { getEmailLogs, getEmailLog } from "../services/email-logs.service"
import type { EmailLogFilters } from "../types/email-log.types"

export function useEmailLogs(filters?: EmailLogFilters) {
  return useQuery({
    queryKey: ["email-logs", filters],
    queryFn: () => getEmailLogs(filters),
    placeholderData: keepPreviousData,
    staleTime: 0,
  })
}

export function useEmailLog(id: string) {
  return useQuery({
    queryKey: ["email-logs", "detail", id],
    queryFn: () => getEmailLog(id),
    enabled: !!id,
  })
}

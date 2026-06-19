import { get, getPaginated } from "@/lib/api"
import type { EmailLog, EmailLogFilters } from "../types/email-log.types"

export function getEmailLogs(filters?: EmailLogFilters) {
  return getPaginated<EmailLog>("/email-logs", filters as object | undefined)
}

export function getEmailLog(id: string) {
  return get<EmailLog>(`/email-logs/${id}`)
}

import api from "@/lib/axios"
import { get } from "@/lib/api"
import type { EmailLog, EmailLogFilters, EmailLogLista } from "../types/email-log.types"

export function getEmailLogs(filters?: EmailLogFilters) {
  return api
    .get<EmailLogLista>("/email-logs", { params: filters as object | undefined })
    .then((response) => response.data)
}

export function getEmailLog(id: string) {
  return get<EmailLog>(`/email-logs/${id}`)
}

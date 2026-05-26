import api from "@/lib/axios"
import type { GerarRelatorioRequest } from "../types/relatorio.types"

export async function gerarRelatorio(data: GerarRelatorioRequest): Promise<Blob> {
  const response = await api.post("/relatorios/gerar", data, { responseType: "blob" })
  return response.data as Blob
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

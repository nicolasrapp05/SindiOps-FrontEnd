import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import { gerarRelatorio, downloadBlob } from "../services/relatorios.service"
import type { GerarRelatorioRequest, RelatorioFormato } from "../types/relatorio.types"

function extensionForFormato(f: RelatorioFormato): string {
  if (f === "pdf") return "pdf"
  if (f === "excel") return "xlsx"
  return "docx"
}

export function useGerarRelatorio() {
  return useMutation({
    mutationFn: (data: GerarRelatorioRequest) => gerarRelatorio(data),
    onSuccess: (blob, variables) => {
      const ext = extensionForFormato(variables.formato)
      downloadBlob(blob, `relatorio-${variables.tipo}.${ext}`)
      toast.success("Download iniciado")
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Erro ao gerar relatório")),
  })
}

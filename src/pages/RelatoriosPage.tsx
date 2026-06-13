import { useState } from "react"
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Combobox from "@/components/shared/Combobox"
import { useGerarRelatorio } from "@/features/relatorios/hooks/useRelatorios"
import {
  RELATORIO_TIPO_LABEL,
  type RelatorioFormato,
  type RelatorioTipo,
} from "@/features/relatorios/types/relatorio.types"
import { useCondominios } from "@/features/condominios/hooks/useCondominios"
import { toast } from "sonner"

const TIPOS: RelatorioTipo[] = [
  "ocorrencias",
  "mapa_cotacoes",
  "lista_compras",
  "agenda_prazos",
  "agenda_mandatos",
  "manutencoes",
]

const STATUS_OPTIONS: Partial<Record<RelatorioTipo, { value: string; label: string }[]>> = {
  ocorrencias: [
    { value: "nova",         label: "Nova"         },
    { value: "em_andamento", label: "Em Andamento" },
    { value: "finalizada",   label: "Finalizada"   },
    { value: "cancelada",    label: "Cancelada"    },
  ],
  mapa_cotacoes: [
    { value: "nova",         label: "Nova"         },
    { value: "em_andamento", label: "Em Andamento" },
    { value: "finalizada",   label: "Finalizada"   },
    { value: "cancelada",    label: "Cancelada"    },
  ],
  lista_compras: [
    { value: "nova",         label: "Nova"         },
    { value: "em_andamento", label: "Em Andamento" },
    { value: "finalizada",   label: "Finalizada"   },
    { value: "cancelada",    label: "Cancelada"    },
  ],
  manutencoes: [
    { value: "nova",         label: "Nova"         },
    { value: "em_andamento", label: "Em Andamento" },
    { value: "finalizada",   label: "Finalizada"   },
    { value: "cancelada",    label: "Cancelada"    },
  ],
}

export default function RelatoriosPage() {
  const [tipo, setTipo] = useState<RelatorioTipo>("ocorrencias")
  const [condominioId, setCondominioId] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("")

  const { data: condominios } = useCondominios()
  const gerar = useGerarRelatorio()

  const statusOptions = STATUS_OPTIONS[tipo]
  const hasStatusFilter = !!statusOptions

  const condominioOptions = [
    { value: "", label: "Selecionar condomínio…" },
    ...(condominios ?? []).map((c) => ({ value: c.id, label: c.nome })),
  ]

  const handleTipoChange = (v: RelatorioTipo) => {
    setTipo(v)
    setStatusFiltro("")
  }

  const buildPayload = (formato: RelatorioFormato) => {
    if (!condominioId) {
      toast.error("Selecione um condomínio")
      return null
    }
    return {
      tipo,
      condominioId,
      formato,
      filtros: {
        ...(dataInicio && { dataInicio }),
        ...(dataFim && { dataFim }),
        ...(statusFiltro && { status: statusFiltro }),
      },
    }
  }

  const handleExport = (formato: RelatorioFormato) => {
    const payload = buildPayload(formato)
    if (payload) gerar.mutate(payload)
  }

  const loadingPdf   = gerar.isPending && gerar.variables?.formato === "pdf"
  const loadingExcel = gerar.isPending && gerar.variables?.formato === "excel"
  const loadingWord  = gerar.isPending && gerar.variables?.formato === "word"

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Relatórios</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gere relatórios em PDF, Excel ou Word com filtros opcionais.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Configurar relatório</CardTitle>
          <CardDescription>
            Escolha o tipo, o condomínio e refine por período ou status quando fizer sentido.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => handleTipoChange(v as RelatorioTipo)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {RELATORIO_TIPO_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condomínio */}
          <div className="space-y-2">
            <Label>Condomínio</Label>
            <Combobox
              options={condominioOptions}
              value={condominioId}
              onValueChange={setCondominioId}
              placeholder="Selecionar condomínio…"
              className="w-full"
            />
          </div>

          {/* Período */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rel-inicio">Data início</Label>
              <Input
                id="rel-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rel-fim">Data fim</Label>
              <Input
                id="rel-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          {/* Status — só exibe quando o tipo tem status definidos */}
          {hasStatusFilter && (
            <div className="space-y-2">
              <Label>Status (opcional)</Label>
              <Combobox
                options={[
                  { value: "", label: "Todos os status" },
                  ...statusOptions,
                ]}
                value={statusFiltro}
                onValueChange={setStatusFiltro}
                placeholder="Todos os status"
                className="w-full"
              />
            </div>
          )}

          {/* Botões de exportação */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
              disabled={gerar.isPending}
              onClick={() => handleExport("pdf")}
            >
              {loadingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Exportar PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
              disabled={gerar.isPending}
              onClick={() => handleExport("excel")}
            >
              {loadingExcel ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              Exportar Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100"
              disabled={gerar.isPending}
              onClick={() => handleExport("word")}
            >
              {loadingWord ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Exportar Word
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

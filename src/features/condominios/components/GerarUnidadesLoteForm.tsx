import { useMemo, useState } from "react"
import { AlertCircle, Hash, Layers, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { CustomPatternConfig, PadraoNumeracao } from "../types/condominio.types"
import {
  DEFAULT_CUSTOM_PATTERN,
  PADRAO_NUMERACAO_OPTIONS,
  computeUnidadesBloco,
  filtrarNumerosNovos,
} from "../utils/estrutura-numeracao"
import CustomPatternBuilder from "./CustomPatternBuilder"

interface GerarUnidadesLoteFormProps {
  blocoNome: string
  numerosExistentes: string[]
  isPending: boolean
  onCancel: () => void
  onGenerate: (numeros: string[], ignorados: number) => Promise<void>
  compact?: boolean
}

export default function GerarUnidadesLoteForm({
  blocoNome,
  numerosExistentes,
  isPending,
  onCancel,
  onGenerate,
  compact = true,
}: GerarUnidadesLoteFormProps) {
  const [andarInicial, setAndarInicial] = useState(1)
  const [totalAndares, setTotalAndares] = useState(5)
  const [unidadesPorAndar, setUnidadesPorAndar] = useState(4)
  const [incluiTerreo, setIncluiTerreo] = useState(false)
  const [incluiCobertura, setIncluiCobertura] = useState(false)
  const [padrao, setPadrao] = useState<PadraoNumeracao>("personalizado")
  const [customCfg, setCustomCfg] = useState<CustomPatternConfig>({
    ...DEFAULT_CUSTOM_PATTERN,
  })

  const previewNumeros = useMemo(
    () =>
      computeUnidadesBloco(
        blocoNome,
        andarInicial,
        totalAndares,
        unidadesPorAndar,
        incluiTerreo,
        incluiCobertura,
        padrao,
        customCfg,
      ),
    [
      blocoNome,
      andarInicial,
      totalAndares,
      unidadesPorAndar,
      incluiTerreo,
      incluiCobertura,
      padrao,
      customCfg,
    ],
  )

  const { criar: numerosParaCriar, ignorados } = useMemo(
    () => filtrarNumerosNovos(previewNumeros, numerosExistentes),
    [previewNumeros, numerosExistentes],
  )

  const totalNovas = numerosParaCriar.length

  const labelClass = compact
    ? "text-xs font-normal text-gray-500"
    : "text-sm font-medium"

  return (
    <div className={cn("space-y-3", compact && "max-h-[26rem] overflow-y-auto pr-0.5")}>
      <section className="space-y-2">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          <Layers className="h-3.5 w-3.5 text-emerald-600" />
          Andares e Unidades
        </h4>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className={labelClass}>Andar inicial</Label>
            <Input
              type="number"
              min={1}
              className="h-8 text-xs"
              value={andarInicial}
              onChange={(e) => setAndarInicial(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <div className="space-y-1">
            <Label className={labelClass}>Total de andares</Label>
            <Input
              type="number"
              min={1}
              className="h-8 text-xs"
              value={totalAndares}
              onChange={(e) => setTotalAndares(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <div className="space-y-1">
            <Label className={labelClass}>Unidades por andar</Label>
            <Input
              type="number"
              min={1}
              className="h-8 text-xs"
              value={unidadesPorAndar}
              onChange={(e) => setUnidadesPorAndar(Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={incluiTerreo}
              onChange={(e) => setIncluiTerreo(e.target.checked)}
              className="accent-emerald-600"
            />
            Incluir Térreo
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={incluiCobertura}
              onChange={(e) => setIncluiCobertura(e.target.checked)}
              className="accent-emerald-600"
            />
            Incluir Cobertura
          </label>
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          <Hash className="h-3.5 w-3.5 text-emerald-600" />
          Padrão de Numeração
        </h4>

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {PADRAO_NUMERACAO_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-md border p-2 transition-colors",
                padrao === opt.value
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              <input
                type="radio"
                name="padrao-lote"
                value={opt.value}
                checked={padrao === opt.value}
                onChange={() => setPadrao(opt.value)}
                className="mt-0.5 accent-emerald-600"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800">{opt.label}</p>
                <p className="text-[11px] text-gray-500">{opt.example}</p>
              </div>
            </label>
          ))}
        </div>

        {padrao === "personalizado" && (
          <CustomPatternBuilder
            cfg={customCfg}
            onChange={setCustomCfg}
            andarInicial={andarInicial}
            compact
          />
        )}
      </section>

      <section className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">Preview</span>
          <span className="text-[11px] text-gray-500">
            {totalNovas} nova{totalNovas !== 1 ? "s" : ""}
            {ignorados > 0 && ` · ${ignorados} já existente${ignorados !== 1 ? "s" : ""}`}
          </span>
        </div>

        {previewNumeros.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            Configure ao menos 1 andar e 1 unidade por andar
          </div>
        ) : totalNovas === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            Todas as unidades geradas já existem neste bloco
          </div>
        ) : (
          <div className="flex flex-wrap gap-1 rounded-md border bg-gray-50 p-2">
            {numerosParaCriar.slice(0, 24).map((u, i) => (
              <span
                key={`${u}-${i}`}
                className="inline-block rounded bg-white px-1.5 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200"
              >
                {u}
              </span>
            ))}
            {numerosParaCriar.length > 24 && (
              <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-400">
                +{numerosParaCriar.length - 24} mais…
              </span>
            )}
          </div>
        )}
      </section>

      <div className="sticky bottom-0 flex justify-end gap-1.5 border-t border-gray-100 bg-white pt-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs text-gray-500"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          className="h-8 bg-emerald-700 px-2.5 text-xs hover:bg-emerald-800"
          disabled={isPending || totalNovas === 0}
          onClick={() => onGenerate(numerosParaCriar, ignorados)}
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            `Gerar ${totalNovas} unidade${totalNovas !== 1 ? "s" : ""}`
          )}
        </Button>
      </div>
    </div>
  )
}

import { Settings2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CustomPatternConfig } from "../types/condominio.types"
import {
  DEFAULT_CUSTOM_PATTERN,
  applyCustomPattern,
} from "../utils/estrutura-numeracao"

interface CustomPatternBuilderProps {
  cfg: CustomPatternConfig
  onChange: (cfg: CustomPatternConfig) => void
  andarInicial: number
  compact?: boolean
}

const PRESETS = [
  { label: "101, 102, 201…", cfg: { ...DEFAULT_CUSTOM_PATTERN } },
  {
    label: "0101, 0102…",
    cfg: {
      prefix: "",
      incluirAndar: true,
      andarFormato: "padded" as const,
      andarDigitos: 2,
      separador: "",
      seqFormato: "padded" as const,
      seqDigitos: 2,
      suffix: "",
    },
  },
  {
    label: "AP-101, AP-102…",
    cfg: {
      prefix: "AP-",
      incluirAndar: true,
      andarFormato: "raw" as const,
      andarDigitos: 2,
      separador: "",
      seqFormato: "padded" as const,
      seqDigitos: 2,
      suffix: "",
    },
  },
  {
    label: "1-01, 1-02…",
    cfg: {
      prefix: "",
      incluirAndar: true,
      andarFormato: "raw" as const,
      andarDigitos: 2,
      separador: "-",
      seqFormato: "padded" as const,
      seqDigitos: 2,
      suffix: "",
    },
  },
  {
    label: "1, 2, 3…",
    cfg: {
      prefix: "",
      incluirAndar: false,
      andarFormato: "raw" as const,
      andarDigitos: 2,
      separador: "",
      seqFormato: "raw" as const,
      seqDigitos: 2,
      suffix: "",
    },
  },
]

export default function CustomPatternBuilder({
  cfg,
  onChange,
  andarInicial,
  compact = false,
}: CustomPatternBuilderProps) {
  const update = (partial: Partial<CustomPatternConfig>) =>
    onChange({ ...cfg, ...partial })

  const sample1 = applyCustomPattern(cfg, andarInicial, 1)
  const sample2 = applyCustomPattern(cfg, andarInicial, 2)
  const sample3 = applyCustomPattern(cfg, andarInicial + 1, 1)

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50",
        compact ? "p-2.5" : "mt-3 space-y-4 p-4",
      )}
    >
      <div className="flex items-center gap-1.5">
        <Settings2 className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-700">
          Construtor de padrão personalizado
        </span>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-md bg-white font-mono ring-1 ring-gray-200",
          compact ? "px-2 py-1.5 text-xs" : "px-3 py-2.5 text-sm",
        )}
      >
        {cfg.prefix && (
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-700">
            "{cfg.prefix}"
          </span>
        )}
        {cfg.incluirAndar && (
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
            andar{cfg.andarFormato === "padded" ? `(${cfg.andarDigitos}d)` : ""}
          </span>
        )}
        {cfg.separador && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
            "{cfg.separador}"
          </span>
        )}
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
          seq{cfg.seqFormato === "padded" ? `(${cfg.seqDigitos}d)` : ""}
        </span>
        {cfg.suffix && (
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-700">
            "{cfg.suffix}"
          </span>
        )}
        <span className="ml-auto text-gray-400">→</span>
        <span className="font-semibold text-gray-800">
          {sample1}, {sample2}, {sample3}…
        </span>
      </div>

      <div
        className={cn(
          "grid gap-x-3 gap-y-2",
          compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3",
        )}
      >
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Prefixo (texto)</Label>
          <Input
            className="h-8 text-xs"
            placeholder='ex: "AP", "SALA"'
            value={cfg.prefix}
            onChange={(e) => update({ prefix: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Número do andar</Label>
          <label className="flex cursor-pointer items-center gap-1.5 pt-1.5 text-xs">
            <input
              type="checkbox"
              checked={cfg.incluirAndar}
              onChange={(e) => update({ incluirAndar: e.target.checked })}
              className="accent-emerald-600"
            />
            Incluir andar
          </label>
        </div>

        {cfg.incluirAndar && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Formato do andar</Label>
            <Select
              value={cfg.andarFormato}
              onValueChange={(v) => update({ andarFormato: v as "raw" | "padded" })}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="raw">Sem zeros (1, 2…)</SelectItem>
                <SelectItem value="padded">Com zeros (01, 02…)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {cfg.incluirAndar && cfg.andarFormato === "padded" && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Dígitos do andar</Label>
            <Input
              type="number"
              min={1}
              max={4}
              className="h-8 text-xs"
              value={cfg.andarDigitos}
              onChange={(e) =>
                update({ andarDigitos: Math.min(4, Math.max(1, Number(e.target.value))) })
              }
            />
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Separador (texto)</Label>
          <Input
            className="h-8 text-xs"
            placeholder='ex: "0", "-", vazio'
            value={cfg.separador}
            onChange={(e) => update({ separador: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Formato da sequência</Label>
          <Select
            value={cfg.seqFormato}
            onValueChange={(v) => update({ seqFormato: v as "raw" | "padded" })}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="raw">Sem zeros (1, 2…)</SelectItem>
              <SelectItem value="padded">Com zeros (01, 02…)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {cfg.seqFormato === "padded" && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Dígitos da sequência</Label>
            <Input
              type="number"
              min={1}
              max={4}
              className="h-8 text-xs"
              value={cfg.seqDigitos}
              onChange={(e) =>
                update({ seqDigitos: Math.min(4, Math.max(1, Number(e.target.value))) })
              }
            />
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Sufixo (texto)</Label>
          <Input
            className="h-8 text-xs"
            placeholder='ex: "A", "-APT"'
            value={cfg.suffix}
            onChange={(e) => update({ suffix: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-emerald-200 pt-2">
        <span className="self-center text-xs text-gray-400">Atalhos:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600 transition hover:border-emerald-400 hover:text-emerald-700"
            onClick={() => onChange(preset.cfg)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}

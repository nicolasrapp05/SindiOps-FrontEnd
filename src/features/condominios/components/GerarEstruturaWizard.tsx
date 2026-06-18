import { useState, useMemo, useEffect } from "react"
import { Loader2, Zap, AlertCircle, Building2, Layers, Hash, Settings2 } from "lucide-react"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { createBloco, createUnidade } from "../services/condominios.service"
import type {
  PadraoNumeracao,
  IdentificacaoBloco,
  CustomPatternConfig,
} from "../types/condominio.types"

interface GerarEstruturaWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  condominioId: string
  condominioNome: string
  onSuccess: () => void
}

interface BlocoPreview {
  nome: string
  unidades: string[]
}

interface ProgressState {
  current: number
  total: number
  message: string
}

const DEFAULT_CUSTOM_PATTERN: CustomPatternConfig = {
  prefix: "",
  incluirAndar: true,
  andarFormato: "raw",
  andarDigitos: 2,
  separador: "0",
  seqFormato: "raw",
  seqDigitos: 2,
  suffix: "",
}

function applyCustomPattern(
  cfg: CustomPatternConfig,
  andar: number | null,
  seq: number,
): string {
  let result = cfg.prefix

  if (cfg.incluirAndar && andar !== null) {
    result +=
      cfg.andarFormato === "padded"
        ? String(andar).padStart(cfg.andarDigitos, "0")
        : String(andar)
  }

  result += cfg.separador

  result +=
    cfg.seqFormato === "padded"
      ? String(seq).padStart(cfg.seqDigitos, "0")
      : String(seq)

  result += cfg.suffix
  return result
}

function gerarNomesBlocos(
  tipo: IdentificacaoBloco,
  quantidade: number,
  customNames: string,
): string[] {
  if (tipo === "letras") {
    return Array.from({ length: quantidade }, (_, i) => String.fromCharCode(65 + i))
  }
  if (tipo === "numeros") {
    return Array.from({ length: quantidade }, (_, i) => String(i + 1))
  }
  return customNames
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, Math.max(quantidade, 1))
}

function computePreview(
  temBlocos: boolean,
  identificacaoBloco: IdentificacaoBloco,
  quantidadeBlocos: number,
  customBlocoNames: string,
  edificioNome: string,
  andarInicial: number,
  totalAndares: number,
  unidadesPorAndar: number,
  incluiTerreo: boolean,
  incluiCobertura: boolean,
  padrao: PadraoNumeracao,
  customCfg: CustomPatternConfig,
): BlocoPreview[] {
  if (totalAndares <= 0 || unidadesPorAndar <= 0) return []

  const nomesBlocos = temBlocos
    ? gerarNomesBlocos(identificacaoBloco, quantidadeBlocos, customBlocoNames)
    : [edificioNome?.trim() || "Edifício"]

  return nomesBlocos.map((nomeBlocoRaw) => {
    const unidades: string[] = []
    let seqGlobal = 1

    if (incluiTerreo) {
      for (let u = 1; u <= unidadesPorAndar; u++) {
        if (padrao === "sequencial") {
          unidades.push(`T${String(seqGlobal).padStart(2, "0")}`)
          seqGlobal++
        } else if (padrao === "letras") {
          unidades.push(`T${String.fromCharCode(64 + u)}`)
        } else if (padrao === "prefixoBloco") {
          const prefix = nomeBlocoRaw.slice(0, 2).toUpperCase()
          unidades.push(`${prefix}T${String(u).padStart(2, "0")}`)
        } else if (padrao === "personalizado") {
          // Térreo: use prefix "T" for floor label
          const cfg: CustomPatternConfig = {
            ...customCfg,
            prefix: customCfg.prefix + "T",
            incluirAndar: false,
          }
          unidades.push(applyCustomPattern(cfg, null, u))
        }
      }
    }

    for (let andar = andarInicial; andar < andarInicial + totalAndares; andar++) {
      for (let u = 1; u <= unidadesPorAndar; u++) {
        if (padrao === "personalizado") {
          unidades.push(applyCustomPattern(customCfg, andar, u))
        } else if (padrao === "sequencial") {
          unidades.push(String(seqGlobal))
          seqGlobal++
        } else if (padrao === "prefixoBloco") {
          const prefix = nomeBlocoRaw.slice(0, 2).toUpperCase()
          unidades.push(`${prefix}${andar * 100 + u}`)
        } else if (padrao === "letras") {
          unidades.push(`${andar}${String.fromCharCode(64 + u)}`)
        }
      }
    }

    if (incluiCobertura) {
      for (let u = 1; u <= unidadesPorAndar; u++) {
        if (padrao === "sequencial") {
          unidades.push(`COB${String(seqGlobal).padStart(2, "0")}`)
          seqGlobal++
        } else if (padrao === "letras") {
          unidades.push(`COB${String.fromCharCode(64 + u)}`)
        } else if (padrao === "prefixoBloco") {
          const prefix = nomeBlocoRaw.slice(0, 2).toUpperCase()
          unidades.push(`${prefix}COB${String(u).padStart(2, "0")}`)
        } else if (padrao === "personalizado") {
          const cfg: CustomPatternConfig = {
            ...customCfg,
            prefix: customCfg.prefix + "COB",
            incluirAndar: false,
          }
          unidades.push(applyCustomPattern(cfg, null, u))
        }
      }
    }

    return { nome: nomeBlocoRaw, unidades }
  })
}

// ── Custom pattern builder ───────────────────────────────────────────────────
interface CustomPatternBuilderProps {
  cfg: CustomPatternConfig
  onChange: (cfg: CustomPatternConfig) => void
  andarInicial: number
}

function CustomPatternBuilder({ cfg, onChange, andarInicial }: CustomPatternBuilderProps) {
  const update = (partial: Partial<CustomPatternConfig>) =>
    onChange({ ...cfg, ...partial })

  const sample1 = applyCustomPattern(cfg, andarInicial, 1)
  const sample2 = applyCustomPattern(cfg, andarInicial, 2)
  const sample3 = applyCustomPattern(cfg, andarInicial + 1, 1)

  return (
    <div className="mt-3 space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
      <div className="flex items-center gap-1.5">
        <Settings2 className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-700">
          Construtor de padrão personalizado
        </span>
      </div>

      {/* Formula preview row */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-md bg-white px-3 py-2.5 text-sm font-mono ring-1 ring-gray-200">
        {cfg.prefix && (
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-700">
            "{cfg.prefix}"
          </span>
        )}
        {cfg.incluirAndar && (
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
            andar
            {cfg.andarFormato === "padded" ? `(${cfg.andarDigitos}d)` : ""}
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

      {/* Builder grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {/* Prefix */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Prefixo (texto)</Label>
          <Input
            className="h-8 text-xs"
            placeholder='ex: "AP", "SALA"'
            value={cfg.prefix}
            onChange={(e) => update({ prefix: e.target.value })}
          />
        </div>

        {/* Include floor toggle */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Número do andar</Label>
          <div className="flex items-center gap-2 pt-1.5">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={cfg.incluirAndar}
                onChange={(e) => update({ incluirAndar: e.target.checked })}
                className="accent-emerald-600"
              />
              Incluir andar
            </label>
          </div>
        </div>

        {/* Floor format */}
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

        {/* Floor padding digits */}
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

        {/* Separator */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Separador (texto)</Label>
          <Input
            className="h-8 text-xs"
            placeholder='ex: "0", "-", vazio'
            value={cfg.separador}
            onChange={(e) => update({ separador: e.target.value })}
          />
        </div>

        {/* Seq format */}
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

        {/* Seq padding digits */}
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

        {/* Suffix */}
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

      {/* Quick presets */}
      <div className="flex flex-wrap gap-1.5 border-t border-emerald-200 pt-3">
        <span className="self-center text-xs text-gray-400">Atalhos:</span>
        {[
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
        ].map((preset) => (
          <button
            key={preset.label}
            className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-600 transition hover:border-emerald-400 hover:text-emerald-700"
            onClick={() => onChange(preset.cfg)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function GerarEstruturaWizard({
  open,
  onOpenChange,
  condominioId,
  condominioNome,
  onSuccess,
}: GerarEstruturaWizardProps) {
  // Block config
  const [temBlocos, setTemBlocos] = useState(true)
  const [identificacaoBloco, setIdentificacaoBloco] = useState<IdentificacaoBloco>("letras")
  const [quantidadeBlocos, setQuantidadeBlocos] = useState(2)
  const [customBlocoNames, setCustomBlocoNames] = useState("")
  const [edificioNome, setEdificioNome] = useState("")

  // Floor & unit config
  const [andarInicial, setAndarInicial] = useState(1)
  const [totalAndares, setTotalAndares] = useState(5)
  const [unidadesPorAndar, setUnidadesPorAndar] = useState(4)
  const [incluiTerreo, setIncluiTerreo] = useState(false)
  const [incluiCobertura, setIncluiCobertura] = useState(false)

  // Numbering
  const [padrao, setPadrao] = useState<PadraoNumeracao>("personalizado")
  const [customCfg, setCustomCfg] = useState<CustomPatternConfig>(DEFAULT_CUSTOM_PATTERN)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<ProgressState>({ current: 0, total: 0, message: "" })

  // Reset all state every time the dialog opens
  useEffect(() => {
    if (!open) return
    setTemBlocos(true)
    setIdentificacaoBloco("letras")
    setQuantidadeBlocos(2)
    setCustomBlocoNames("")
    setEdificioNome("")
    setAndarInicial(1)
    setTotalAndares(5)
    setUnidadesPorAndar(4)
    setIncluiTerreo(false)
    setIncluiCobertura(false)
    setPadrao("personalizado")
    setCustomCfg({ ...DEFAULT_CUSTOM_PATTERN })
    setIsGenerating(false)
    setProgress({ current: 0, total: 0, message: "" })
  }, [open])

  const preview = useMemo(
    () =>
      computePreview(
        temBlocos,
        identificacaoBloco,
        quantidadeBlocos,
        customBlocoNames,
        edificioNome || condominioNome,
        andarInicial,
        totalAndares,
        unidadesPorAndar,
        incluiTerreo,
        incluiCobertura,
        padrao,
        customCfg,
      ),
    [
      temBlocos,
      identificacaoBloco,
      quantidadeBlocos,
      customBlocoNames,
      edificioNome,
      condominioNome,
      andarInicial,
      totalAndares,
      unidadesPorAndar,
      incluiTerreo,
      incluiCobertura,
      padrao,
      customCfg,
    ],
  )

  const totalUnidades = preview.reduce((acc, b) => acc + b.unidades.length, 0)

  const customBlocoCount =
    identificacaoBloco === "custom"
      ? customBlocoNames
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean).length
      : quantidadeBlocos

  async function handleGerar() {
    if (preview.length === 0) {
      toast.error("Configure ao menos 1 bloco e 1 unidade por andar")
      return
    }

    setIsGenerating(true)
    setProgress({ current: 0, total: totalUnidades, message: "Iniciando geração..." })

    let criados = 0
    let erros = 0

    for (const blocoPreview of preview) {
      setProgress((prev) => ({
        ...prev,
        message: `Criando Bloco ${blocoPreview.nome}…`,
      }))

      let blocoId: string
      try {
        const bloco = await createBloco(condominioId, blocoPreview.nome)
        blocoId = bloco.id
      } catch (err) {
        toast.error(getApiErrorMessage(err, `Erro ao criar bloco "${blocoPreview.nome}"`))
        erros++
        continue
      }

      for (const numero of blocoPreview.unidades) {
        try {
          await createUnidade(condominioId, blocoId, numero)
          criados++
          setProgress((prev) => ({
            ...prev,
            current: criados,
            message: `Bloco ${blocoPreview.nome} — ${criados}/${totalUnidades} unidades`,
          }))
        } catch {
          erros++
        }
      }
    }

    setIsGenerating(false)

    if (erros > 0 && criados === 0) {
      toast.error("Falha ao gerar a estrutura. Verifique e tente novamente.")
    } else if (erros > 0) {
      toast.warning(`Estrutura criada com ${criados} unidades. ${erros} item(ns) com erro.`)
    } else {
      toast.success(`Estrutura criada: ${preview.length} bloco(s) · ${criados} unidades`)
    }

    onSuccess()
    onOpenChange(false)
  }

  function handleClose() {
    if (isGenerating) return
    onOpenChange(false)
  }

  const progressPercent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-600" />
            Configuração Rápida de Estrutura
          </DialogTitle>
          <DialogDescription>
            Gere blocos e unidades automaticamente para{" "}
            <span className="font-medium text-gray-700">{condominioNome}</span>.
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <div className="space-y-5 py-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="text-sm font-medium text-gray-700">{progress.message}</p>
            </div>
            <div className="overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-center text-xs text-gray-400">
              {progress.current} / {progress.total} unidades criadas ({progressPercent}%)
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* ── Seção Blocos ─────────────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Blocos
              </h3>

              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="temBlocos"
                    checked={temBlocos}
                    onChange={() => setTemBlocos(true)}
                    className="accent-emerald-600"
                  />
                  Com blocos
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="temBlocos"
                    checked={!temBlocos}
                    onChange={() => setTemBlocos(false)}
                    className="accent-emerald-600"
                  />
                  Prédio único (sem divisão em blocos)
                </label>
              </div>

              {temBlocos ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Identificação dos blocos</Label>
                    <Select
                      value={identificacaoBloco}
                      onValueChange={(v) => setIdentificacaoBloco(v as IdentificacaoBloco)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="letras">Letras (A, B, C…)</SelectItem>
                        <SelectItem value="numeros">Números (1, 2, 3…)</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {identificacaoBloco !== "custom" ? (
                    <div className="space-y-1.5">
                      <Label>Quantidade de blocos</Label>
                      <Input
                        type="number"
                        min={1}
                        max={26}
                        value={quantidadeBlocos}
                        onChange={(e) =>
                          setQuantidadeBlocos(Math.max(1, Number(e.target.value)))
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label>Nomes dos blocos (separados por vírgula)</Label>
                      <Input
                        placeholder="Torre Sul, Torre Norte, Leste"
                        value={customBlocoNames}
                        onChange={(e) => setCustomBlocoNames(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Nome do edifício (opcional)</Label>
                  <Input
                    placeholder={condominioNome}
                    value={edificioNome}
                    onChange={(e) => setEdificioNome(e.target.value)}
                  />
                </div>
              )}
            </section>

            {/* ── Seção Andares e Unidades ─────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <Layers className="h-4 w-4 text-emerald-600" />
                Andares e Unidades
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Andar inicial</Label>
                  <Input
                    type="number"
                    min={1}
                    value={andarInicial}
                    onChange={(e) => setAndarInicial(Math.max(1, Number(e.target.value)))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Total de andares</Label>
                  <Input
                    type="number"
                    min={1}
                    value={totalAndares}
                    onChange={(e) => setTotalAndares(Math.max(1, Number(e.target.value)))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Unidades por andar</Label>
                  <Input
                    type="number"
                    min={1}
                    value={unidadesPorAndar}
                    onChange={(e) => setUnidadesPorAndar(Math.max(1, Number(e.target.value)))}
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={incluiTerreo}
                    onChange={(e) => setIncluiTerreo(e.target.checked)}
                    className="accent-emerald-600"
                  />
                  Incluir Térreo
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
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

            {/* ── Padrão de Numeração ──────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <Hash className="h-4 w-4 text-emerald-600" />
                Padrão de Numeração
              </h3>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [
                    {
                      value: "personalizado",
                      label: "Personalizado",
                      example: "configure abaixo",
                      disabled: false,
                    },
                    {
                      value: "sequencial",
                      label: "Sequencial simples",
                      example: "1, 2, 3, 4…",
                      disabled: false,
                    },
                    {
                      value: "prefixoBloco",
                      label: "Prefixo do bloco",
                      example: "A101, A102, B101…",
                      disabled: !temBlocos,
                    },
                    {
                      value: "letras",
                      label: "Letras por unidade",
                      example: "1A, 1B, 2A, 2B…",
                      disabled: false,
                    },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                      padrao === opt.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    } ${opt.disabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <input
                      type="radio"
                      name="padrao"
                      value={opt.value}
                      checked={padrao === opt.value}
                      disabled={opt.disabled}
                      onChange={() => !opt.disabled && setPadrao(opt.value)}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.example}</p>
                    </div>
                  </label>
                ))}
              </div>

              {padrao === "personalizado" && (
                <CustomPatternBuilder
                  cfg={customCfg}
                  onChange={setCustomCfg}
                  andarInicial={andarInicial}
                />
              )}
            </section>

            {/* ── Preview ─────────────────────────────────────────────────── */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Preview</h3>
                <span className="text-xs text-gray-500">
                  {temBlocos ? `${customBlocoCount} bloco(s)` : "1 edifício"} ·{" "}
                  {totalUnidades} unidades
                </span>
              </div>

              {preview.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  Configure ao menos 1 andar e 1 unidade por andar
                </div>
              ) : (
                <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border bg-gray-50 p-3">
                  {preview.map((bloco) => (
                    <div key={bloco.nome}>
                      <p className="mb-1 text-xs font-semibold text-gray-600">
                        {temBlocos ? `Bloco ${bloco.nome}` : bloco.nome}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {bloco.unidades.slice(0, 30).map((u, i) => (
                          <span
                            key={`${bloco.nome}-${i}`}
                            className="inline-block rounded bg-white px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200"
                          >
                            {u}
                          </span>
                        ))}
                        {bloco.unidades.length > 30 && (
                          <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                            +{bloco.unidades.length - 30} mais…
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={handleGerar}
            disabled={isGenerating || preview.length === 0 || totalUnidades === 0}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? "Gerando…" : `Gerar ${totalUnidades} unidades`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

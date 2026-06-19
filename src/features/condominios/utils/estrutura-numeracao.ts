import type {
  CustomPatternConfig,
  IdentificacaoBloco,
  PadraoNumeracao,
} from "../types/condominio.types"

export const DEFAULT_CUSTOM_PATTERN: CustomPatternConfig = {
  prefix: "",
  incluirAndar: true,
  andarFormato: "raw",
  andarDigitos: 2,
  separador: "0",
  seqFormato: "raw",
  seqDigitos: 2,
  suffix: "",
}

export const PADRAO_NUMERACAO_OPTIONS = [
  {
    value: "personalizado" as const,
    label: "Personalizado",
    example: "configure abaixo",
  },
  {
    value: "sequencial" as const,
    label: "Sequencial simples",
    example: "1, 2, 3, 4…",
  },
  {
    value: "prefixoBloco" as const,
    label: "Prefixo do bloco",
    example: "A101, A102, B101…",
  },
  {
    value: "letras" as const,
    label: "Letras por unidade",
    example: "1A, 1B, 2A, 2B…",
  },
]

export function gerarNomesBlocos(
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

export function applyCustomPattern(
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

export function computeUnidadesBloco(
  nomeBloco: string,
  andarInicial: number,
  totalAndares: number,
  unidadesPorAndar: number,
  incluiTerreo: boolean,
  incluiCobertura: boolean,
  padrao: PadraoNumeracao,
  customCfg: CustomPatternConfig,
): string[] {
  if (totalAndares <= 0 || unidadesPorAndar <= 0) return []

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
        const prefix = nomeBloco.slice(0, 2).toUpperCase()
        unidades.push(`${prefix}T${String(u).padStart(2, "0")}`)
      } else if (padrao === "personalizado") {
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
        const prefix = nomeBloco.slice(0, 2).toUpperCase()
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
        const prefix = nomeBloco.slice(0, 2).toUpperCase()
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

  return unidades
}

export function normalizeNumeroUnidade(numero: string) {
  return numero.trim().toLowerCase()
}

export function filtrarNumerosNovos(numeros: string[], existentes: string[]) {
  const existingSet = new Set(existentes.map(normalizeNumeroUnidade))
  const criar = numeros.filter((n) => !existingSet.has(normalizeNumeroUnidade(n)))
  return {
    criar,
    ignorados: numeros.length - criar.length,
  }
}

import type { CSSProperties } from "react"

export type ListColumnTrack =
  | { kind: "rigid"; size: string }
  | { kind: "flex"; min: string; max?: string; fit?: boolean }
  | { kind: "actions"; collapsed: string; expanded?: string }

function fixed(size: string): ListColumnTrack {
  return { kind: "rigid", size }
}

export function listFit(max: string): ListColumnTrack {
  return { kind: "flex", min: "4rem", max, fit: true }
}

function fill(min: string): ListColumnTrack {
  return { kind: "flex", min }
}

export function listFlex(min: string, max: string): ListColumnTrack {
  return { kind: "flex", min, max }
}

function actions(collapsed: string, expanded?: string): ListColumnTrack {
  return { kind: "actions", collapsed, expanded }
}

export const listColumn = {
  textLg: fill("3rem"),
  date: listFit("6.5rem"),
  dateCreated: listFit("10.75rem"),
  datetime: listFit("12rem"),
  prazo: listFit("11rem"),
  money: fixed("8.25rem"),
  count: fixed("4.75rem"),
  propostas: fixed("7rem"),
  tipoAprovacao: listFit("6.25rem"),
  unit: fixed("6rem"),
  status: listFit("8.125rem"),
  situacao: listFit("10.375rem"),
  label: listFit("7rem"),
  phone: listFit("8.5rem"),
  cnpj: listFit("10.875rem"),
  cargo: listFit("6.75rem"),
  actions1: actions("4rem"),
  actions2: actions("4rem", "7.5rem"),
  actions3: actions("4rem", "10rem"),
  actions4: actions("4rem", "12.75rem"),
  actionsCancel: actions("4rem", "12.5rem"),
  actionsRealizada: actions("4rem", "20rem"),
} as const

export function listColumns(
  ...tracks: Array<ListColumnTrack | false | null | undefined>
): ListColumnTrack[] {
  return tracks.filter((track): track is ListColumnTrack => track != null && track !== false)
}

const BLANK_FLOOR_REM = 4
const FILL_PREFERRED_REM = 12

type MeasuredTrack = {
  preferred: number
  floor: number
  role: "column" | "actions" | "fill"
  blank: boolean
  fit: boolean
}

function toPx(size: string, rootPx: number): number {
  if (size.endsWith("rem")) return Number.parseFloat(size) * rootPx
  if (size.endsWith("px")) return Number.parseFloat(size)
  return 0
}

function measuredTrack(track: ListColumnTrack, rootPx: number): MeasuredTrack {
  if (track.kind === "actions") {
    const collapsed = toPx(track.collapsed, rootPx)
    const expanded = track.expanded ? toPx(track.expanded, rootPx) : collapsed
    return { preferred: expanded, floor: collapsed, role: "actions", blank: false, fit: false }
  }
  if (track.kind === "rigid") {
    const size = toPx(track.size, rootPx)
    return { preferred: size, floor: size, role: "column", blank: false, fit: false }
  }
  const floor = toPx(track.min, rootPx)
  if (!track.max) {
    return {
      preferred: Math.max(floor, FILL_PREFERRED_REM * rootPx),
      floor,
      role: "fill",
      blank: false,
      fit: false,
    }
  }
  return {
    preferred: toPx(track.max, rootPx),
    floor,
    role: "column",
    blank: false,
    fit: track.fit === true,
  }
}

function shrinkTracks(sizes: number[], items: MeasuredTrack[], indexes: number[], deficit: number) {
  if (deficit <= 0 || indexes.length === 0) return deficit
  const slack = indexes.map((index) => Math.max(0, sizes[index] - items[index].floor))
  const total = slack.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return deficit
  const cut = Math.min(deficit, total)
  indexes.forEach((index, position) => {
    sizes[index] -= cut * (slack[position] / total)
  })
  return deficit - cut
}

// Em telas menores: primeiro as colunas em que toda a página é "-",
// depois a troca das ações para o menu, e só então as colunas com conteúdo.
export function measureListLayout({
  columns,
  blank,
  headerMins,
  contentMins,
  contentWidths,
  width,
  rootPx,
}: {
  columns: readonly ListColumnTrack[]
  blank: readonly boolean[]
  headerMins?: readonly number[]
  contentMins?: readonly number[]
  contentWidths?: readonly number[]
  width: number
  rootPx: number
}): { template: string; expandActions: boolean } {
  const blankFloor = BLANK_FLOOR_REM * rootPx
  const items = columns.map((track, index) => {
    let item = measuredTrack(track, rootPx)
    if (item.role !== "actions" && blank[index]) {
      item = { ...item, blank: true, floor: Math.min(item.preferred, blankFloor), role: "column" }
    }
    if (track.kind === "flex" && track.fit && track.max) {
      const cap = toPx(track.max, rootPx)
      const content = contentWidths?.[index] ?? 0
      const header = headerMins?.[index] ?? 0
      const fitted = content > 0 ? Math.min(cap, content) : 0
      const preferred = Math.max(header, fitted)
      const floor = header > 0 ? Math.max(header, fitted) : item.floor
      return { ...item, preferred, floor: Math.min(preferred, floor), fit: true }
    }
    const header = headerMins?.[index] ?? 0
    if (header > 0) {
      item = { ...item, floor: Math.max(item.floor, header), preferred: Math.max(item.preferred, header) }
    }
    return item
  })
  const sizes = items.map((item) => item.preferred)
  const actions = items.findIndex((item) => item.role === "actions")
  const fill = actions === -1 ? items.findIndex((item) => item.role === "fill") : -1
  const grower = actions >= 0 ? actions : fill
  const sum = () => sizes.reduce((total, size) => total + size, 0)

  let deficit = sum() - width
  deficit = shrinkTracks(
    sizes,
    items,
    items.flatMap((item, index) => (item.blank ? [index] : [])),
    deficit,
  )

  let expandActions = actions >= 0 && items[actions].preferred > items[actions].floor + 0.5
  if (deficit > 0 && expandActions) {
    sizes[actions] = items[actions].floor
    expandActions = false
    deficit = sum() - width
  }

  if (deficit > 0) {
    deficit = shrinkTracks(
      sizes,
      items,
      items.flatMap((item, index) =>
        index !== actions && !item.blank && item.preferred > item.floor + 0.5 ? [index] : [],
      ),
      deficit,
    )
  }

  // A coluna de ações fica na largura do ícone. Se ainda não cabe, as colunas
  // rígidas cedem até o título e o badge visível, em vez de cortar o ícone.
  if (deficit > 0) {
    items.forEach((item, index) => {
      if (index === actions || item.fit) return
      const title = headerMins?.[index] ?? 0
      const content = contentMins?.[index] ?? 0
      const limit = Math.max(title, content)
      if (limit > 0 && limit < item.floor) item.floor = limit
    })
    deficit = shrinkTracks(
      sizes,
      items,
      items.flatMap((item, index) => (index !== actions && sizes[index] > item.floor + 0.5 ? [index] : [])),
      deficit,
    )
  }

  const release = (onlyBlank: boolean) => {
    if (deficit <= 0) return
    const hard = BLANK_FLOOR_REM * rootPx
    items.forEach((item, index) => {
      if (index === actions || (onlyBlank && !item.blank)) return
      const title = headerMins?.[index] ?? 0
      const content = contentMins?.[index] ?? 0
      item.floor = item.fit
        ? Math.max(title, Math.min(item.floor, title || hard))
        : Math.max(title, Math.min(item.floor, Math.max(hard, content)))
    })
    deficit = shrinkTracks(
      sizes,
      items,
      items.flatMap((item, index) => (index !== actions && sizes[index] > item.floor + 0.5 ? [index] : [])),
      deficit,
    )
  }

  release(true)
  release(false)

  const template = items
    .map((item, index) => {
      const size = Math.max(Math.floor(item.floor), Math.floor(sizes[index]))
      return index === grower ? `minmax(${size}px, 1fr)` : `${size}px`
    })
    .join(" ")

  return { template, expandActions }
}

export function listTableStyle(columns: readonly ListColumnTrack[]): CSSProperties {
  return { gridTemplateColumns: columns.map(toTrack).join(" ") }
}

function toTrack(track: ListColumnTrack): string {
  if (track.kind === "flex") {
    return track.max ? `minmax(${track.min}, ${track.max})` : `minmax(${track.min}, 1fr)`
  }
  if (track.kind === "actions") {
    const min = track.expanded ? `var(--list-actions, ${track.collapsed})` : track.collapsed
    return `minmax(${min}, 1fr)`
  }
  return track.size
}

export const listClosedLabelClass = "line-clamp-2 min-w-0 whitespace-normal leading-[19px]"

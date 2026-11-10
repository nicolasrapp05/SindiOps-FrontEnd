"use client"

import * as React from "react"

import { listTableStyle, measureListLayout, type ListColumnTrack } from "@/components/shared/list-columns"
import { cn } from "@/lib/utils"

const ListTableContext = React.createContext(false)
const BLANK_TEXT = new Set(["", "-", "—", "–"])

type TableProps = React.ComponentProps<"table"> & {
  columns?: readonly ListColumnTrack[]
}

function textWidth(text: string, source: Element) {
  const style = getComputedStyle(source)
  const probe = document.createElement("span")
  probe.textContent = text
  probe.style.position = "absolute"
  probe.style.visibility = "hidden"
  probe.style.whiteSpace = "nowrap"
  probe.style.font = style.font
  probe.style.fontWeight = style.fontWeight
  probe.style.letterSpacing = style.letterSpacing
  document.body.appendChild(probe)
  const width = probe.getBoundingClientRect().width
  probe.remove()
  return width
}

function readHeaderMins(table: HTMLTableElement, count: number): number[] {
  const headers = [...table.querySelectorAll(":scope > thead > tr > th")].slice(0, count) as HTMLTableCellElement[]
  return Array.from({ length: count }, (_, index) => {
    const th = headers[index]
    if (!th) return 0
    const style = getComputedStyle(th)
    const pad = (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0)
    const label = th.querySelector("button span")
    if (label) {
      const button = th.querySelector("button")
      const icon = th.querySelector("svg")
      const iconWidth = icon?.getBoundingClientRect().width ?? 0
      const gap = button ? Number.parseFloat(getComputedStyle(button).columnGap) || 0 : 0
      return Math.ceil(pad + iconWidth + gap + textWidth(label.textContent ?? "", label) + 4)
    }
    return Math.ceil(pad + textWidth(th.innerText, th) + 4)
  })
}

function horizontalBox(el: Element) {
  const style = getComputedStyle(el)
  return (
    (Number.parseFloat(style.paddingLeft) || 0) +
    (Number.parseFloat(style.paddingRight) || 0) +
    (Number.parseFloat(style.borderLeftWidth) || 0) +
    (Number.parseFloat(style.borderRightWidth) || 0)
  )
}

function readContentWidths(table: HTMLTableElement, count: number): number[] {
  const rows = [...table.querySelectorAll(":scope > tbody > tr")].filter((row) => {
    const cells = [...row.children] as HTMLTableCellElement[]
    return cells.length === count && cells.every((cell) => cell.colSpan === 1 && !cell.querySelector("[data-slot=skeleton]"))
  })
  return Array.from({ length: count }, (_, index) => {
    let max = 0
    for (const row of rows) {
      const cell = row.children[index] as HTMLElement
      const cellPad = horizontalBox(cell)
      const leaves = [...cell.querySelectorAll("*")].filter((el) => el.children.length === 0)
      if (leaves.length === 0) {
        const text = (cell.innerText ?? "").replace(/\s+/g, " ").trim()
        if (!BLANK_TEXT.has(text)) max = Math.max(max, Math.ceil(textWidth(text, cell) + cellPad + 2))
        continue
      }
      for (const leaf of leaves) {
        const text = (leaf.textContent ?? "").replace(/\s+/g, " ").trim()
        if (BLANK_TEXT.has(text)) continue
        let extra = 0
        let node: HTMLElement | null = leaf as HTMLElement
        while (node && node !== cell) {
          extra += horizontalBox(node)
          node = node.parentElement
        }
        max = Math.max(max, Math.ceil(textWidth(text, leaf) + extra + cellPad + 2))
      }
    }
    return max
  })
}

function readContentMins(table: HTMLTableElement, count: number): number[] {
  const rows = [...table.querySelectorAll(":scope > tbody > tr")].filter((row) => {
    const cells = [...row.children] as HTMLTableCellElement[]
    return cells.length === count && cells.every((cell) => cell.colSpan === 1 && !cell.querySelector("[data-slot=skeleton]"))
  })
  return Array.from({ length: count }, (_, index) => {
    let min = 0
    for (const row of rows) {
      const cell = row.children[index] as HTMLElement
      const badge = cell.querySelector("[data-slot=badge]")
      if (!badge) continue
      const badgeStyle = getComputedStyle(badge)
      const cellStyle = getComputedStyle(cell)
      const text = textWidth((badge.textContent ?? "").trim(), badge)
      const badgePad =
        (Number.parseFloat(badgeStyle.paddingLeft) || 0) +
        (Number.parseFloat(badgeStyle.paddingRight) || 0) +
        (Number.parseFloat(badgeStyle.borderLeftWidth) || 0) +
        (Number.parseFloat(badgeStyle.borderRightWidth) || 0)
      const cellPad =
        (Number.parseFloat(cellStyle.paddingLeft) || 0) + (Number.parseFloat(cellStyle.paddingRight) || 0)
      min = Math.max(min, Math.ceil(text + badgePad + cellPad + 2))
    }
    return min
  })
}

function readBlankColumns(table: HTMLTableElement, count: number): boolean[] {
  const none = () => Array.from({ length: count }, () => false)
  if (table.querySelector("tbody [data-slot=skeleton]")) return none()
  const rows = [...table.querySelectorAll(":scope > tbody > tr")].filter((row) => {
    const cells = [...row.children] as HTMLTableCellElement[]
    return cells.length === count && cells.every((cell) => cell.colSpan === 1)
  })
  if (rows.length === 0) return none()
  return Array.from({ length: count }, (_, index) =>
    rows.every((row) =>
      BLANK_TEXT.has(((row.children[index] as HTMLElement | undefined)?.innerText ?? "").replace(/\s+/g, " ").trim()),
    ),
  )
}

function Table({ className, columns, style, ...props }: TableProps) {
  const list = (columns?.length ?? 0) > 0
  const pinActions = list && columns![columns!.length - 1]?.kind === "actions"
  const containerRef = React.useRef<HTMLDivElement>(null)
  const tableRef = React.useRef<HTMLTableElement>(null)
  const columnsRef = React.useRef(columns)
  columnsRef.current = columns
  const [layout, setLayout] = React.useState<{ template: string; expandActions: boolean } | null>(null)

  const applyLayout = React.useCallback(() => {
    const cols = columnsRef.current
    const container = containerRef.current
    const table = tableRef.current
    if (!cols?.length || !container || !table) return
    const width = container.clientWidth
    if (width < 32) return
    const rootPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const next = measureListLayout({
      columns: cols,
      blank: readBlankColumns(table, cols.length),
      headerMins: readHeaderMins(table, cols.length),
      contentMins: readContentMins(table, cols.length),
      contentWidths: readContentWidths(table, cols.length),
      width,
      rootPx,
    })
    setLayout((current) =>
      current?.template === next.template && current.expandActions === next.expandActions ? current : next,
    )
  }, [])

  React.useLayoutEffect(() => {
    applyLayout()
  })

  React.useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => applyLayout())
    observer.observe(container)
    return () => observer.disconnect()
  }, [applyLayout])

  return (
    <ListTableContext.Provider value={list}>
      <div
        ref={containerRef}
        data-slot="table-container"
        className={cn("relative w-full min-w-0", list ? "overflow-x-hidden" : "overflow-x-auto")}
      >
        <table
          ref={tableRef}
          data-slot="table"
          data-actions-expanded={layout?.expandActions ? "" : undefined}
          data-pin-actions={pinActions ? "" : undefined}
          role={list ? "table" : undefined}
          className={cn("w-full caption-bottom text-sm", list && "list-table", className)}
          style={
            list
              ? { ...listTableStyle(columns!), ...(layout ? { gridTemplateColumns: layout.template } : {}), ...style }
              : style
          }
          {...props}
        />
      </div>
    </ListTableContext.Provider>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  const list = React.useContext(ListTableContext)

  return (
    <thead
      data-slot="table-header"
      role={list ? "rowgroup" : undefined}
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  const list = React.useContext(ListTableContext)

  return (
    <tbody
      data-slot="table-body"
      role={list ? "rowgroup" : undefined}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  const list = React.useContext(ListTableContext)

  return (
    <tfoot
      data-slot="table-footer"
      role={list ? "rowgroup" : undefined}
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  const list = React.useContext(ListTableContext)

  return (
    <tr
      data-slot="table-row"
      role={list ? "row" : undefined}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  const list = React.useContext(ListTableContext)

  return (
    <th
      data-slot="table-head"
      role={list ? "columnheader" : undefined}
      className={cn(
        "h-11 px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  const list = React.useContext(ListTableContext)

  return (
    <td
      data-slot="table-cell"
      role={list ? "cell" : undefined}
      className={cn(
        "px-3 py-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

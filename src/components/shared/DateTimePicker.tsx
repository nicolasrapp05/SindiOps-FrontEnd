import { useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ChevronDownIcon, X } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"
import type { Matcher } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useNarrowScreen } from "@/lib/use-narrow-screen"
import { cn } from "@/lib/utils"

const FIRST_MONTH = new Date(1970, 0, 1)
const LAST_MONTH = new Date(2100, 11, 1)
const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute)

interface DateTimePickerProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
  min?: string
  max?: string
  disabled?: boolean
  placeholder?: string
  "aria-invalid"?: boolean
  "aria-label"?: string
  className?: string
}

function parseIsoDateTime(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hours = Number(match[4])
  const minutes = Number(match[5])
  if (hours > 23 || minutes > 59) return undefined
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return undefined
  }
  return date
}

function toIsoDateTime(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}T${hours}:${minutes}`
}

function atTime(day: Date, hours: number, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes, 0, 0)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function clampDate(date: Date, min?: Date, max?: Date): Date {
  if (min && date < min) return min
  if (max && date > max) return max
  return date
}

function dayHasValidTime(day: Date, min?: Date, max?: Date): boolean {
  if (max && atTime(day, 0, 0) > max) return false
  if (min && atTime(day, 23, 59) < min) return false
  return true
}

function isHourDisabled(day: Date, hour: number, min?: Date, max?: Date): boolean {
  if (max && atTime(day, hour, 0) > max) return true
  if (min && atTime(day, hour, 59) < min) return true
  return false
}

function isMinuteDisabled(day: Date, hour: number, minute: number, min?: Date, max?: Date): boolean {
  const candidate = atTime(day, hour, minute)
  if (min && candidate < min) return true
  if (max && candidate > max) return true
  return false
}

function TimeList({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: number
  options: { value: number; disabled: boolean }[]
  onChange: (value: number) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open || !listRef.current) return
    const current = listRef.current.querySelector<HTMLElement>("[data-selected='true']")
    if (!current) return
    listRef.current.scrollTop =
      current.offsetTop - listRef.current.clientHeight / 2 + current.clientHeight / 2
  }, [open])

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div ref={rootRef} className={cn("relative", open && "z-30")}>
        <button
          type="button"
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex h-7 items-center gap-1 rounded-md px-1.5 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          {selected ? String(selected.value).padStart(2, "0") : String(value).padStart(2, "0")}
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        </button>
        {open && (
          <div
            ref={listRef}
            role="listbox"
            aria-label={label}
            // O diálogo trava o scroll da página e cancelaria a roda e o toque nesta lista.
            onWheel={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
            className="absolute bottom-[calc(100%+4px)] left-1/2 z-30 max-h-36 w-[4.5rem] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
          >
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected || undefined}
                  disabled={option.disabled}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "w-full rounded-md px-1.5 py-1 text-center text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-40",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {String(option.value).padStart(2, "0")}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DateTimePicker({
  id,
  value,
  onValueChange,
  min,
  max,
  disabled,
  placeholder = "Selecionar data e hora",
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  className,
}: DateTimePickerProps) {
  const isNarrow = useNarrowScreen()
  const [open, setOpen] = useState(false)
  const selected = parseIsoDateTime(value)
  const minDate = parseIsoDateTime(min)
  const maxDate = parseIsoDateTime(max)
  const anchor = selected ?? clampDate(new Date(), minDate, maxDate)
  const timeDay = selected ?? new Date()
  const restrictTime = dayHasValidTime(timeDay, minDate, maxDate)
  const startMonth = startOfMonth(minDate ?? FIRST_MONTH)
  const endMonth = startOfMonth(maxDate ?? LAST_MONTH)
  const [month, setMonth] = useState(() => selected ?? anchor)

  useEffect(() => {
    if (!open) return
    const current = parseIsoDateTime(value)
    setMonth(current ?? clampDate(new Date(), parseIsoDateTime(min), parseIsoDateTime(max)))
  }, [open, value, min, max])

  const disabledDays: Matcher[] = []
  if (minDate) disabledDays.push({ before: startOfDay(minDate) })
  if (maxDate) disabledDays.push({ after: startOfDay(maxDate) })

  const commit = (day: Date, hours: number, minutes: number) => {
    const next = clampDate(atTime(day, hours, minutes), minDate, maxDate)
    onValueChange(toIsoDateTime(next))
    setMonth(next)
  }

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    commit(date, anchor.getHours(), anchor.getMinutes())
  }

  const handleHour = (hour: number) => {
    commit(timeDay, hour, anchor.getMinutes())
  }

  const handleMinute = (minute: number) => {
    commit(timeDay, anchor.getHours(), minute)
  }

  const hourOptions = HOURS.map((hour) => ({
    value: hour,
    disabled: restrictTime && isHourDisabled(timeDay, hour, minDate, maxDate),
  }))
  const minuteOptions = MINUTES.map((minute) => ({
    value: minute,
    disabled: restrictTime && isMinuteDisabled(timeDay, anchor.getHours(), minute, minDate, maxDate),
  }))

  const calendar = (
    <Calendar
      mode="single"
      locale={ptBR}
      weekStartsOn={1}
      captionLayout="dropdown"
      startMonth={startMonth}
      endMonth={endMonth}
      month={month}
      onMonthChange={setMonth}
      selected={selected}
      onSelect={handleSelect}
      disabled={disabledDays.length > 0 ? disabledDays : undefined}
      className={cn(
        "bg-transparent p-0",
        isNarrow ? "mx-auto [--cell-size:2.75rem]" : "[--cell-size:2rem]",
      )}
    />
  )

  const panel = (
    <div>
      {calendar}
      <div className="mt-2 flex items-end justify-center gap-4 border-t border-border px-1 pt-2">
        <TimeList label="Hora" value={anchor.getHours()} options={hourOptions} onChange={handleHour} />
        <span className="pb-1 text-sm font-medium text-muted-foreground">:</span>
        <TimeList label="Minuto" value={anchor.getMinutes()} options={minuteOptions} onChange={handleMinute} />
      </div>
      {isNarrow && (
        <Button type="button" size="sm" className="mt-3 w-full" onClick={() => setOpen(false)}>
          Concluir
        </Button>
      )}
    </div>
  )

  const trigger = (
    <button
      id={id}
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid || undefined}
      aria-haspopup="dialog"
      aria-expanded={open}
      {...(isNarrow ? { onClick: () => setOpen(true) } : {})}
      className={cn(
        "flex h-10 w-full min-w-0 items-center rounded-lg border border-input bg-card px-3 text-left text-base transition-[color,background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] outline-none md:text-sm",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        selected ? "pr-16 text-foreground" : "pr-9 text-muted-foreground",
      )}
    >
      <span className="truncate">
        {selected ? format(selected, "dd/MM/yyyy HH:mm", { locale: ptBR }) : placeholder}
      </span>
    </button>
  )

  return (
    <div className={cn("relative", className)}>
      {isNarrow ? (
        <>
          {trigger}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
              className="w-[min(22rem,calc(100%-2rem))] p-3 sm:max-w-[22rem]"
              showCloseButton={false}
            >
              <DialogHeader className="sr-only">
                <DialogTitle>Selecionar data e hora</DialogTitle>
              </DialogHeader>
              {panel}
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              align="start"
              sideOffset={4}
              collisionPadding={8}
              className="pointer-events-auto z-[60] rounded-lg bg-popover p-2 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            >
              {panel}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      )}

      {selected && !disabled && (
        <button
          type="button"
          aria-label="Limpar data e hora"
          className="absolute top-1/2 right-8 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onValueChange("")
          }}
        >
          <X className="size-3.5" />
        </button>
      )}
      <CalendarIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

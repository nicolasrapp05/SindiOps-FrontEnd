import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"
import type { Matcher } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const FIRST_MONTH = new Date(1970, 0, 1)
const LAST_MONTH = new Date(2100, 11, 1)

interface DatePickerProps {
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

function parseIsoDate(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined
  }
  return date
}

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function clampDate(date: Date, min?: Date, max?: Date): Date {
  if (min && date < min) return min
  if (max && date > max) return max
  return date
}

function useIsNarrowScreen() {
  const [matches, setMatches] = useState(() => window.matchMedia("(max-width: 767px)").matches)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const onChange = () => setMatches(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  return matches
}

export default function DatePicker({
  id,
  value,
  onValueChange,
  min,
  max,
  disabled,
  placeholder = "Selecionar data",
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  className,
}: DatePickerProps) {
  const isNarrow = useIsNarrowScreen()
  const [open, setOpen] = useState(false)
  const selected = parseIsoDate(value)
  const minDate = parseIsoDate(min)
  const maxDate = parseIsoDate(max)
  const startMonth = startOfMonth(minDate ?? FIRST_MONTH)
  const endMonth = startOfMonth(maxDate ?? LAST_MONTH)
  const [month, setMonth] = useState(() => selected ?? clampDate(new Date(), minDate, maxDate))

  useEffect(() => {
    if (!open) return
    setMonth(parseIsoDate(value) ?? clampDate(new Date(), parseIsoDate(min), parseIsoDate(max)))
  }, [open, value, min, max])

  const disabledDays: Matcher[] = []
  if (minDate) disabledDays.push({ before: minDate })
  if (maxDate) disabledDays.push({ after: maxDate })

  const handleSelect = (date: Date | undefined) => {
    if (date) onValueChange(toIsoDate(date))
    setOpen(false)
  }

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
      <span className="truncate">{selected ? format(selected, "dd/MM/yyyy") : placeholder}</span>
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
                <DialogTitle>Selecionar data</DialogTitle>
              </DialogHeader>
              {calendar}
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
              {calendar}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      )}

      {selected && !disabled && (
        <button
          type="button"
          aria-label="Limpar data"
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

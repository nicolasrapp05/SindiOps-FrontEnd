import { useState, useRef, useMemo } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import type { ComboboxOption } from "./Combobox"

interface MultiComboboxProps {
  options: ComboboxOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

export default function MultiCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecionar",
  emptyText = "Nenhum resultado encontrado",
  disabled,
  className,
}: MultiComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [dropdownWidth, setDropdownWidth] = useState(0)
  const anchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOptions = useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value],
  )

  const filtered = useMemo(
    () =>
      search.trim()
        ? options.filter((o) =>
            o.label.toLowerCase().includes(search.toLowerCase().trim()),
          )
        : options,
    [options, search],
  )

  const handleFocus = () => {
    if (anchorRef.current) {
      setDropdownWidth(anchorRef.current.getBoundingClientRect().width)
    }
    setSearch("")
    setOpen(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    if (!open) setOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false)
      setSearch("")
      inputRef.current?.blur()
    }
    if (e.key === "Backspace" && !search && value.length > 0) {
      onValueChange(value.slice(0, -1))
    }
  }

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onValueChange(value.filter((v) => v !== optionValue))
    } else {
      onValueChange([...value, optionValue])
    }
    setSearch("")
    inputRef.current?.focus()
  }

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange(value.filter((v) => v !== optionValue))
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setOpen(false)
          setSearch("")
        }
      }}
    >
      <PopoverPrimitive.Anchor asChild>
        <div
          ref={anchorRef}
          className={cn(
            "relative flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent py-1 pl-2 pr-8 text-sm transition-colors",
            "hover:border-ring/50",
            "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
          onClick={() => !disabled && inputRef.current?.focus()}
        >
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800"
            >
              <span className="truncate">{option.label}</span>
              {!disabled && (
                <button
                  type="button"
                  className="rounded-sm hover:bg-emerald-200/80"
                  aria-label={`Remover ${option.label}`}
                  onClick={(e) => removeOption(option.value, e)}
                >
                  <X className="size-3" />
                </button>
              )}
            </span>
          ))}
          <input
            ref={inputRef}
            value={search}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={selectedOptions.length === 0 ? placeholder : "Buscar..."}
            disabled={disabled}
            autoComplete="off"
            className={cn(
              "min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
              disabled && "cursor-not-allowed",
            )}
          />
          <ChevronDown
            className={cn(
              "pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </div>
      </PopoverPrimitive.Anchor>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) {
              e.preventDefault()
            }
          }}
          style={{ width: dropdownWidth > 0 ? `${dropdownWidth}px` : undefined }}
          className="z-50 overflow-hidden rounded-lg bg-popover p-0 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <div
            role="listbox"
            aria-multiselectable
            onMouseDown={(e) => e.preventDefault()}
            onWheel={(e) => e.stopPropagation()}
            style={{ maxHeight: "208px", overflowY: "scroll" }}
            className="dropdown-scroll p-1"
          >
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filtered.map((option) => {
                const isSelected = value.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      "relative flex w-full cursor-default items-center rounded-md py-1 pl-1.5 pr-8 text-sm outline-none",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/50 text-primary font-medium",
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                        <Check className="size-4 text-primary" />
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

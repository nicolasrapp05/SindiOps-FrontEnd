import { useState, useRef, useMemo } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import { useNarrowScreen } from "@/lib/use-narrow-screen"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

const fieldClass = cn(
  "flex h-10 w-full rounded-lg border border-input bg-card text-sm transition-[color,background-color,border-color,box-shadow] duration-200 outline-none",
  "placeholder:text-muted-foreground",
  "hover:border-ring/50",
  "focus:border-ring focus:ring-3 focus:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
)

export default function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecionar",
  searchPlaceholder,
  emptyText = "Nenhum resultado encontrado",
  disabled,
  className,
}: ComboboxProps) {
  const isNarrow = useNarrowScreen()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [dropdownWidth, setDropdownWidth] = useState(0)
  const anchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((o) => o.value === value)
  const searchLabel = searchPlaceholder ?? "Busca"

  const filtered = useMemo(
    () =>
      search.trim()
        ? options.filter((o) =>
            o.label.toLowerCase().includes(search.toLowerCase().trim()),
          )
        : options,
    [options, search],
  )

  const syncWidth = () => {
    if (anchorRef.current) {
      setDropdownWidth(anchorRef.current.getBoundingClientRect().width)
    }
  }

  const handleFocus = () => {
    syncWidth()
    setSearch("")
    setOpen(true)
  }

  const handleNarrowOpen = () => {
    if (disabled || open) return
    syncWidth()
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
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault()
      handleSelect(filtered[0].value)
    }
  }

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setOpen(false)
    setSearch("")
    inputRef.current?.blur()
  }

  // No desktop o próprio campo é a busca. No celular o rótulo fica no botão.
  const inputDisplayValue = open ? search : (selectedOption?.label ?? "")

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
      {/* Âncora posiciona o dropdown relativo ao campo sem ser um trigger de click */}
      <PopoverPrimitive.Anchor asChild>
        <div ref={anchorRef} className={cn("relative", className)}>
          {isNarrow ? (
            <button
              type="button"
              disabled={disabled}
              aria-haspopup="listbox"
              aria-expanded={open}
              onClick={handleNarrowOpen}
              className={cn(
                fieldClass,
                "cursor-pointer items-center pl-3 pr-8 text-left",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                !selectedOption && "text-muted-foreground",
              )}
            >
              <span className="truncate">{selectedOption?.label ?? placeholder}</span>
            </button>
          ) : (
            <input
              ref={inputRef}
              value={inputDisplayValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder={open ? (searchPlaceholder ?? placeholder) : placeholder}
              disabled={disabled}
              autoComplete="off"
              className={cn(fieldClass, "pl-3 pr-8")}
            />
          )}
          <ChevronDown
            className={cn(
              "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-transform duration-150",
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
          // Não roubar o foco do campo ao abrir
          onOpenAutoFocus={(e) => e.preventDefault()}
          // Clicar no próprio campo (âncora) não deve fechar
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) {
              e.preventDefault()
            }
          }}
          style={{ width: dropdownWidth > 0 ? `${dropdownWidth}px` : undefined }}
          className="z-50 overflow-hidden rounded-lg bg-popover p-0 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          {isNarrow && (
            <div className="p-1 pb-0">
              <input
                ref={inputRef}
                value={search}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={searchLabel}
                disabled={disabled}
                autoComplete="off"
                aria-label={searchLabel}
                className={cn(fieldClass, "px-3")}
              />
            </div>
          )}
          <div
            role="listbox"
            // Impede o blur do input ao clicar num item
            onMouseDown={(e) => e.preventDefault()}
            // Impede react-remove-scroll (do Dialog) de cancelar o scroll
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            style={{ maxHeight: "208px", overflowY: "scroll" }}
            className="dropdown-scroll overscroll-contain p-1"
          >
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filtered.map((option) => {
                const isSelected = value === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "relative flex min-h-9 w-full cursor-pointer items-center rounded-md py-2 pl-1.5 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
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

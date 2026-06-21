import { useState, useRef, useMemo } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

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
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [dropdownWidth, setDropdownWidth] = useState(0)
  const anchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((o) => o.value === value)

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

  // Quando fechado: mostra o label selecionado; quando aberto: mostra o termo de busca
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
      {/* Âncora posiciona o dropdown relativo ao input sem ser um trigger de click */}
      <PopoverPrimitive.Anchor asChild>
        <div ref={anchorRef} className={cn("relative", className)}>
          <input
            ref={inputRef}
            value={inputDisplayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={open ? (searchPlaceholder ?? placeholder) : placeholder}
            disabled={disabled}
            autoComplete="off"
            className={cn(
              "flex h-8 w-full rounded-lg border border-input bg-transparent pl-2.5 pr-8 text-sm transition-colors outline-none",
              "placeholder:text-muted-foreground",
              "hover:border-ring/50",
              "focus:border-ring focus:ring-3 focus:ring-ring/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
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
          // Não roubar o foco do input ao abrir
          onOpenAutoFocus={(e) => e.preventDefault()}
          // Clicar no próprio input (âncora) não deve fechar
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
            // Impede o blur do input ao clicar num item
            onMouseDown={(e) => e.preventDefault()}
            // Impede react-remove-scroll (do Dialog) de cancelar o scroll
            onWheel={(e) => e.stopPropagation()}
            style={{ maxHeight: "208px", overflowY: "scroll" }}
            className="dropdown-scroll p-1"
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

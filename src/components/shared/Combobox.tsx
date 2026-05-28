import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  searchPlaceholder = "Pesquisar...",
  emptyText = "Nenhum resultado encontrado",
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = value ? options.find((o) => o.value === value) : undefined

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase().trim()),
  )

  useEffect(() => {
    if (open) {
      setSearch("")
      // defer focus so popover animation completes
      const id = setTimeout(() => inputRef.current?.focus(), 10)
      return () => clearTimeout(id)
    }
  }, [open])

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault()
      handleSelect(filtered[0].value)
    }
    if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent pl-2.5 pr-2 text-sm whitespace-nowrap transition-colors outline-none select-none",
            "hover:border-ring/50",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selectedOption && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>
          <ChevronDown className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        {/* Search bar */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Options list */}
        <div role="listbox" className="max-h-56 overflow-y-auto p-1">
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
                    "focus:bg-accent focus:text-accent-foreground",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "text-primary font-medium",
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
      </PopoverContent>
    </Popover>
  )
}

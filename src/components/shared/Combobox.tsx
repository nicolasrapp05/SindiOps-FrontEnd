import { useState, useRef, useEffect } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
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
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selectedOption && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] p-0 gap-0"
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
        <div role="listbox" className="max-h-60 overflow-y-auto p-1">
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
                    "relative flex w-full cursor-default items-center rounded-md py-1.5 pl-3 pr-8 text-sm outline-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent/50 font-medium",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="absolute right-2 h-4 w-4 shrink-0 text-emerald-700" />
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

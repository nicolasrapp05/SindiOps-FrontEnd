import * as React from "react"
import { cn } from "@/lib/utils"
import { formatCurrencyAmount, parseCurrencyDigits } from "@/lib/currency"

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value?: number | null
  onValueChange?: (value: number | undefined) => void
  /** Quando true, campo vazio envia `undefined` em vez de 0. */
  allowEmpty?: boolean
}

export default function CurrencyInput({
  value,
  onValueChange,
  allowEmpty = false,
  className,
  disabled,
  readOnly,
  id,
  onFocus,
  onClick,
  onKeyDown,
  ...props
}: CurrencyInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const displayValue = React.useMemo(() => {
    if (allowEmpty && (value === undefined || value === null)) return ""
    if (value == null || !Number.isFinite(value)) {
      return allowEmpty ? "" : formatCurrencyAmount(0)
    }
    return formatCurrencyAmount(value)
  }, [value, allowEmpty])

  const moveCursorToEnd = React.useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const end = el.value.length
    el.setSelectionRange(end, end)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || disabled) return
    const parsed = parseCurrencyDigits(e.target.value)
    if (parsed === undefined) {
      onValueChange?.(allowEmpty ? undefined : 0)
    } else {
      onValueChange?.(parsed)
    }
    requestAnimationFrame(moveCursorToEnd)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
    if (readOnly || disabled) return
    e.preventDefault()
    inputRef.current?.focus()
    requestAnimationFrame(moveCursorToEnd)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    requestAnimationFrame(moveCursorToEnd)
    onFocus?.(e)
  }

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    requestAnimationFrame(moveCursorToEnd)
    onClick?.(e)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!readOnly && !disabled && (e.key === "Home" || e.key === "ArrowLeft")) {
      e.preventDefault()
      moveCursorToEnd()
    }
    onKeyDown?.(e)
  }

  return (
    <div
      className={cn(
        "flex h-8 w-full min-w-0 items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors md:text-sm",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        disabled && "pointer-events-none cursor-not-allowed bg-input/50 opacity-50",
        readOnly && "bg-muted/50",
        props["aria-invalid"] && "border-destructive ring-3 ring-destructive/20",
        className,
      )}
    >
      <span className="shrink-0 text-sm text-muted-foreground" aria-hidden>
        R$
      </span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-left tabular-nums outline-none",
          "placeholder:text-muted-foreground",
          readOnly && "cursor-default",
        )}
        value={displayValue}
        onChange={handleChange}
        onMouseDown={handleMouseDown}
        onFocus={handleFocus}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  )
}

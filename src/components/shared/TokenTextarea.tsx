import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react"
import { cn } from "@/lib/utils"

export interface TokenDef {
  token: string  // e.g. "{{nome_morador}}"
  label: string  // e.g. "Nome do morador"
}

export interface TokenTextareaHandle {
  insertToken: (token: string, label: string) => void
  focus: () => void
}

interface TokenTextareaProps {
  value: string | null | undefined
  onChange: (value: string) => void
  tokens: TokenDef[]
  placeholder?: string
  className?: string
  minRows?: number
}

// ── helpers ──────────────────────────────────────────────────────────────────

const TOKEN_RE = /(\{\{[^}]+\}\})/g

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function chipHTML(token: string, label: string): string {
  const safeToken = token.replace(/"/g, "&quot;")
  return `<span data-token="${safeToken}" class="token-chip" contenteditable="false">${esc(label)}</span>`
}

/** Convert template string → innerHTML with chip spans */
function templateToHTML(template: string | null | undefined, tokens: TokenDef[]): string {
  if (!template) return ""
  return template
    .split(TOKEN_RE)
    .map((part) => {
      const tok = tokens.find((t) => t.token === part)
      if (tok) return chipHTML(tok.token, tok.label)
      return esc(part).replace(/\n/g, "<br>")
    })
    .join("")
}

/** Walk the DOM of the contenteditable div and reconstruct the template string */
function domToTemplate(root: HTMLElement): string {
  let out = ""

  function walk(node: ChildNode) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? ""
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    const tag = el.tagName

    if (tag === "BR") { out += "\n"; return }

    // chip span
    if (el.dataset.token) { out += el.dataset.token; return }

    // browser wraps new lines in <div> or <p>
    if ((tag === "DIV" || tag === "P") && out && !out.endsWith("\n")) out += "\n"

    el.childNodes.forEach(walk)
  }

  root.childNodes.forEach(walk)
  return out
}

// ── component ────────────────────────────────────────────────────────────────

const TokenTextarea = forwardRef<TokenTextareaHandle, TokenTextareaProps>(
  function TokenTextarea(
    { value, onChange, tokens, placeholder, className, minRows = 10 },
    ref,
  ) {
    const divRef = useRef<HTMLDivElement>(null)
    const lastValueRef = useRef(value)
    const isComposingRef = useRef(false)

    // Set innerHTML from template string (preserves cursor only when called externally)
    const syncDOM = useCallback(
      (template: string | null | undefined) => {
        if (!divRef.current) return
        divRef.current.innerHTML = templateToHTML(template, tokens)
      },
      [tokens],
    )

    // Initial render
    useEffect(() => {
      syncDOM(value ?? "")
      lastValueRef.current = value ?? ""
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // External value change (e.g. form reset / edit pre-fill)
    useEffect(() => {
      const normalized = value ?? ""
      if (normalized !== lastValueRef.current) {
        syncDOM(normalized)
        lastValueRef.current = normalized
      }
    }, [value, syncDOM])

    // Read DOM → emit template string
    const handleInput = useCallback(() => {
      if (!divRef.current || isComposingRef.current) return
      const newValue = domToTemplate(divRef.current)
      lastValueRef.current = newValue
      onChange(newValue)
    }, [onChange])

    // Strip HTML on paste
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault()
      const text = e.clipboardData.getData("text/plain")
      document.execCommand("insertText", false, text)
    }, [])

    // Expose imperative methods to parent
    useImperativeHandle(ref, () => ({
      insertToken(token: string, label: string) {
        const div = divRef.current
        if (!div) return
        div.focus()

        const chip = document.createElement("span")
        chip.dataset.token = token
        chip.className = "token-chip"
        chip.contentEditable = "false"
        chip.textContent = label

        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0)
          if (div.contains(range.commonAncestorContainer)) {
            range.deleteContents()
            range.insertNode(chip)
            // Move cursor after chip
            const after = range.cloneRange()
            after.setStartAfter(chip)
            after.collapse(true)
            sel.removeAllRanges()
            sel.addRange(after)
          } else {
            div.appendChild(chip)
          }
        } else {
          div.appendChild(chip)
        }

        // Trigger onChange
        const inputEv = new Event("input", { bubbles: true })
        div.dispatchEvent(inputEv)
      },
      focus() {
        divRef.current?.focus()
      },
    }))

    return (
      <div className="relative">
        {/* Placeholder */}
        {!value && placeholder && (
          <span className="pointer-events-none absolute left-3 top-2 select-none text-sm text-muted-foreground">
            {placeholder}
          </span>
        )}

        <div
          ref={divRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={handleInput}
          onPaste={handlePaste}
          onCompositionStart={() => { isComposingRef.current = true }}
          onCompositionEnd={() => {
            isComposingRef.current = false
            handleInput()
          }}
          className={cn(
            "w-full overflow-y-auto rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm",
            "transition-colors outline-none",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "whitespace-pre-wrap break-words",
            className,
          )}
          style={{ minHeight: `${minRows * 1.5}rem` }}
        />
      </div>
    )
  },
)

TokenTextarea.displayName = "TokenTextarea"

export default TokenTextarea

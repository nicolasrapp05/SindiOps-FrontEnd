import type { FieldErrors, FieldValues } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

export function getFirstFormError(errors: FieldErrors<FieldValues>): string | undefined {
  for (const value of Object.values(errors)) {
    if (!value || typeof value !== "object") continue

    if ("message" in value && value.message) return String(value.message)

    if ("root" in value && value.root && typeof value.root === "object") {
      const root = value.root as FieldErrors<FieldValues>[string]
      if (root && "message" in root && root.message) return String(root.message)
    }

    const nested = getFirstFormError(value as FieldErrors<FieldValues>)
    if (nested) return nested
  }
  return undefined
}

export function toastFormValidationError(errors: FieldErrors<FieldValues>) {
  const message = getFirstFormError(errors)
  toast.error(message ?? "Preencha os campos obrigatórios antes de continuar.")
}

/** Aceita number, null ou undefined — útil para campos carregados da API. */
export const optionalNumber = z.union([z.number(), z.null()]).optional()

export function requiredNumberField(message: string, min?: number, minMessage?: string) {
  let schema = z.coerce.number({ message })
  if (min !== undefined) {
    schema = schema.min(min, minMessage ?? message)
  }
  return schema
}

export function optionalNumberField() {
  return z.coerce.number().optional()
}

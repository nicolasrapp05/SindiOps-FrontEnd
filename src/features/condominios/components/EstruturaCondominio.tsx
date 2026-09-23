import { useState, useRef, useEffect } from "react"
import {
  Building2,
  Plus,
  Zap,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useBlocos,
  useCreateBloco,
  useUpdateBloco,
  useDeleteBloco,
  useCreateUnidade,
  useUpdateUnidade,
  useDeleteUnidade,
} from "../hooks/useCondominios"
import type { Bloco, Unidade } from "../types/condominio.types"
import { normalizeNumeroUnidade } from "../utils/estrutura-numeracao"
import GerarEstruturaWizard from "./GerarEstruturaWizard"
import GerarUnidadesLoteForm from "./GerarUnidadesLoteForm"

interface EstruturaCondominioProps {
  condominioId: string
  condominioNome: string
}

// ── Inline rename input ──────────────────────────────────────────────────────
interface RenameInputProps {
  initialValue: string
  onConfirm: (value: string) => void
  onCancel: () => void
  isPending: boolean
}

function RenameInput({ initialValue, onConfirm, onCancel, isPending }: RenameInputProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <Input
        ref={inputRef}
        className="h-7 w-32 text-xs"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) onConfirm(value.trim())
          if (e.key === "Escape") onCancel()
        }}
      />
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center rounded-lg text-emerald-700 transition hover:bg-emerald-50"
        disabled={isPending || !value.trim()}
        aria-label="Confirmar nome"
        onClick={() => value.trim() && onConfirm(value.trim())}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
      </button>
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
        aria-label="Cancelar edição"
        onClick={onCancel}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

// ── Add-units popover ────────────────────────────────────────────────────────
interface AddUnidadesPopoverProps {
  blocoId: string
  blocoNome: string
  condominioId: string
  numerosExistentes: string[]
  onClose: () => void
}

function AddUnidadesPopover({
  blocoId,
  blocoNome,
  condominioId,
  numerosExistentes,
  onClose,
}: AddUnidadesPopoverProps) {
  const [modo, setModo] = useState<"individual" | "lote">("individual")
  const [numero, setNumero] = useState("")

  const createUnidade = useCreateUnidade(condominioId)

  async function handleIndividual() {
    const valor = numero.trim()
    if (!valor) return

    if (numerosExistentes.some((n) => normalizeNumeroUnidade(n) === normalizeNumeroUnidade(valor))) {
      toast.error("Já existe uma unidade com este número neste bloco")
      return
    }

    try {
      await createUnidade.mutateAsync({ blocoId, numero: valor })
      toast.success(`Unidade ${valor} criada`)
      setNumero("")
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao criar unidade"))
    }
  }

  async function handleLote(numerosParaCriar: string[], ignorados: number) {
    try {
      for (const n of numerosParaCriar) {
        await createUnidade.mutateAsync({ blocoId, numero: n })
      }

      const msg =
        ignorados > 0
          ? `${numerosParaCriar.length} unidade${numerosParaCriar.length !== 1 ? "s" : ""} criada${numerosParaCriar.length !== 1 ? "s" : ""} · ${ignorados} ignorada${ignorados !== 1 ? "s" : ""} (já existente${ignorados !== 1 ? "s" : ""})`
          : `${numerosParaCriar.length} unidade${numerosParaCriar.length !== 1 ? "s" : ""} criada${numerosParaCriar.length !== 1 ? "s" : ""}`

      toast.success(msg)
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Erro ao criar unidades"))
    }
  }

  return (
    <div
      className="mt-2 rounded-lg border border-border bg-card p-2.5"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2.5 inline-flex rounded-md bg-gray-100 p-0.5">
        <button
          type="button"
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition",
            modo === "individual"
              ? "bg-card text-emerald-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
          onClick={() => setModo("individual")}
        >
          Individual
        </button>
        <button
          type="button"
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition",
            modo === "lote"
              ? "bg-card text-emerald-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
          onClick={() => setModo("lote")}
        >
          Em lote
        </button>
      </div>

      {modo === "individual" ? (
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs font-normal text-gray-500">Número</Label>
            <Input
              className="h-8 w-24 text-xs"
              placeholder="Ex: 101"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleIndividual()
                if (e.key === "Escape") onClose()
              }}
              autoFocus
            />
          </div>
          <Button
            size="sm"
            className="h-9 px-2.5 text-xs"
            disabled={createUnidade.isPending || !numero.trim()}
            onClick={handleIndividual}
          >
            {createUnidade.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Adicionar"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs text-gray-500"
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <GerarUnidadesLoteForm
          blocoNome={blocoNome}
          numerosExistentes={numerosExistentes}
          isPending={createUnidade.isPending}
          onCancel={onClose}
          onGenerate={handleLote}
        />
      )}
    </div>
  )
}

// ── Unit chip ────────────────────────────────────────────────────────────────
interface UnidadeChipProps {
  unidade: Unidade
  blocoId: string
  condominioId: string
}

function UnidadeChip({ unidade, blocoId, condominioId }: UnidadeChipProps) {
  const [editando, setEditando] = useState(false)
  const updateUnidade = useUpdateUnidade(condominioId)
  const deleteUnidade = useDeleteUnidade(condominioId)

  function handleDelete() {
    deleteUnidade.mutate(
      { blocoId, unidadeId: unidade.id },
      {
        onSuccess: () => toast.success(`Unidade ${unidade.numero} removida`),
        onError: (err: unknown) => {
          const apiMsg = getApiErrorMessage(err, "Erro ao remover unidade")
          toast.error(
            apiMsg.includes("moradores")
              ? "Não é possível remover: há moradores vinculados a esta unidade"
              : apiMsg,
          )
        },
      },
    )
  }

  if (editando) {
    return (
      <RenameInput
        initialValue={unidade.numero}
        isPending={updateUnidade.isPending}
        onConfirm={(numero) =>
          updateUnidade.mutate(
            { blocoId, unidadeId: unidade.id, numero },
            {
              onSuccess: () => {
                toast.success("Unidade renomeada")
                setEditando(false)
              },
              onError: (err) =>
                toast.error(getApiErrorMessage(err, "Erro ao renomear unidade")),
            },
          )
        }
        onCancel={() => setEditando(false)}
      />
    )
  }

  return (
    <span className="inline-flex items-center gap-0.5 rounded-lg bg-muted px-1 py-0.5 text-sm font-medium text-foreground">
      <button
        type="button"
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-card hover:text-foreground"
        onClick={() => setEditando(true)}
        aria-label={`Renomear unidade ${unidade.numero}`}
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </button>
      {unidade.numero}
      <button
        type="button"
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-card hover:text-red-600"
        onClick={handleDelete}
        disabled={deleteUnidade.isPending}
        aria-label={`Remover unidade ${unidade.numero}`}
      >
        {deleteUnidade.isPending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <X className="size-3.5" aria-hidden="true" />
        )}
      </button>
    </span>
  )
}

// ── Bloco row ────────────────────────────────────────────────────────────────
interface BlocoRowProps {
  bloco: Bloco
  condominioId: string
  autoExpand: boolean
}

function BlocoRow({ bloco, condominioId, autoExpand }: BlocoRowProps) {
  const [expanded, setExpanded] = useState(autoExpand)
  const [editandoNome, setEditandoNome] = useState(false)
  const [addingUnidade, setAddingUnidade] = useState(false)
  const [confirmDeleteBloco, setConfirmDeleteBloco] = useState(false)

  const updateBloco = useUpdateBloco(condominioId)
  const deleteBloco = useDeleteBloco(condominioId)

  function handleDeleteBloco() {
    deleteBloco.mutate(bloco.id, {
      onSuccess: () => toast.success(`Bloco ${bloco.nome} removido`),
      onError: (err: unknown) => {
        const apiMsg = getApiErrorMessage(err, "Erro ao remover bloco")
        toast.error(
          apiMsg.includes("moradores")
            ? "Não é possível remover: há moradores vinculados a este bloco"
            : apiMsg,
        )
        setConfirmDeleteBloco(false)
      },
    })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="flex flex-1 items-center gap-2 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}

          {editandoNome ? (
            <RenameInput
              initialValue={bloco.nome}
              isPending={updateBloco.isPending}
              onConfirm={(nome) =>
                updateBloco.mutate(
                  { blocoId: bloco.id, nome },
                  {
                    onSuccess: () => {
                      toast.success("Bloco renomeado")
                      setEditandoNome(false)
                    },
                    onError: (err) =>
                      toast.error(getApiErrorMessage(err, "Erro ao renomear bloco")),
                  },
                )
              }
              onCancel={() => setEditandoNome(false)}
            />
          ) : (
            <>
              <span className="text-sm font-medium text-gray-800">{bloco.nome}</span>
              <span className="text-xs text-muted-foreground">
                {bloco.unidades.length} unidade{bloco.unidades.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1">
          {!editandoNome && (
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Renomear bloco"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(true)
                setEditandoNome(true)
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}

          {confirmDeleteBloco ? (
            <div className="flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-xs">
              <span className="text-red-700">Remover bloco e todas as unidades?</span>
              <button
                className="font-semibold text-red-600 hover:text-red-800"
                onClick={handleDeleteBloco}
                disabled={deleteBloco.isPending}
              >
                {deleteBloco.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Confirmar"
                )}
              </button>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setConfirmDeleteBloco(false)}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
              aria-label="Remover bloco"
              onClick={(e) => {
                e.stopPropagation()
                setConfirmDeleteBloco(true)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Unidades */}
      {expanded && (
        <div className="border-t bg-gray-50/50 px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {bloco.unidades.map((u) => (
              <UnidadeChip
                key={u.id}
                unidade={u}
                blocoId={bloco.id}
                condominioId={condominioId}
              />
            ))}

            {bloco.unidades.length === 0 && (
              <span className="text-xs text-muted-foreground">Nenhuma unidade cadastrada</span>
            )}
          </div>

          {addingUnidade ? (
            <AddUnidadesPopover
              blocoId={bloco.id}
              blocoNome={bloco.nome}
              condominioId={condominioId}
              numerosExistentes={bloco.unidades.map((u) => u.numero)}
              onClose={() => setAddingUnidade(false)}
            />
          ) : (
            <button
              className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-500 transition hover:border-emerald-400 hover:text-emerald-600"
              onClick={() => setAddingUnidade(true)}
            >
              <Plus className="h-3 w-3" />
              Adicionar unidades
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function EstruturaCondominio({
  condominioId,
  condominioNome,
}: EstruturaCondominioProps) {
  const { data: blocos, isLoading } = useBlocos(condominioId)

  const [wizardOpen, setWizardOpen] = useState(false)
  const [addingBloco, setAddingBloco] = useState(false)
  const [newBlocoName, setNewBlocoName] = useState("")

  const createBloco = useCreateBloco(condominioId)

  function handleCreateBloco() {
    if (!newBlocoName.trim()) return
    createBloco.mutate(newBlocoName.trim(), {
      onSuccess: () => {
        setNewBlocoName("")
        setAddingBloco(false)
        toast.success("Bloco criado com sucesso")
      },
      onError: (err) => toast.error(getApiErrorMessage(err, "Erro ao criar bloco")),
    })
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
        <Skeleton className="mb-4 h-6 w-64" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div id="estrutura-condominio" className="scroll-mt-6 rounded-2xl bg-card p-6 ring-1 ring-border">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-foreground">
            Estrutura - {condominioNome}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
            onClick={() => setWizardOpen(true)}
          >
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            Configuração Rápida
          </Button>

          {addingBloco ? (
            <div className="flex items-center gap-2">
              <Input
                className="h-9 w-40"
                placeholder="Nome do bloco"
                value={newBlocoName}
                onChange={(e) => setNewBlocoName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateBloco()
                  if (e.key === "Escape") {
                    setAddingBloco(false)
                    setNewBlocoName("")
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                
                disabled={createBloco.isPending || !newBlocoName.trim()}
                onClick={handleCreateBloco}
              >
                {createBloco.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-4 w-4" />
                )}
                Criar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingBloco(false)
                  setNewBlocoName("")
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAddingBloco(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Adicionar Bloco
            </Button>
          )}
        </div>
      </div>

      {/* Blocos list */}
      <div className="space-y-2">
        {blocos?.map((bloco: Bloco) => (
          <BlocoRow
            key={bloco.id}
            bloco={bloco}
            condominioId={condominioId}
            autoExpand={(blocos?.length ?? 0) <= 3}
          />
        ))}

        {(!blocos || blocos.length === 0) && (
          <div className="rounded-lg border border-dashed border-border py-10 text-center">
            <Building2 className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-muted-foreground">Nenhum bloco cadastrado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use{" "}
              <button
                className="font-medium text-emerald-600 hover:underline"
                onClick={() => setWizardOpen(true)}
              >
                Configuração Rápida
              </button>{" "}
              para gerar a estrutura automaticamente
            </p>
          </div>
        )}
      </div>

      {/* Wizard */}
      <GerarEstruturaWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        condominioId={condominioId}
        condominioNome={condominioNome}
        onSuccess={() => {}}
      />
    </div>
  )
}

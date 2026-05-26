import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Building2,
  DoorOpen,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { getBlocos, createBloco, createUnidade } from "../services/condominios.service"
import type { Bloco } from "../types/condominio.types"

interface EstruturaCondominioProps {
  condominioId: string
  condominioNome: string
}

export default function EstruturaCondominio({
  condominioId,
  condominioNome,
}: EstruturaCondominioProps) {
  const qc = useQueryClient()
  const queryKey = ["condominios", condominioId, "blocos"]

  const { data: blocos, isLoading } = useQuery({
    queryKey,
    queryFn: () => getBlocos(condominioId),
    enabled: !!condominioId,
  })

  const [expandedBlocos, setExpandedBlocos] = useState<Set<string>>(new Set())
  const [newBlocoName, setNewBlocoName] = useState("")
  const [addingBloco, setAddingBloco] = useState(false)
  const [addingUnidade, setAddingUnidade] = useState<string | null>(null)
  const [newUnidadeNumero, setNewUnidadeNumero] = useState("")

  const toggleBloco = (id: string) => {
    setExpandedBlocos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const createBlocoMutation = useMutation({
    mutationFn: (nome: string) => createBloco(condominioId, nome),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      setNewBlocoName("")
      setAddingBloco(false)
      toast.success("Bloco criado com sucesso")
    },
    onError: () => toast.error("Erro ao criar bloco"),
  })

  const createUnidadeMutation = useMutation({
    mutationFn: ({ blocoId, numero }: { blocoId: string; numero: string }) =>
      createUnidade(condominioId, blocoId, numero),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      setNewUnidadeNumero("")
      setAddingUnidade(null)
      toast.success("Unidade criada com sucesso")
    },
    onError: () => toast.error("Erro ao criar unidade"),
  })

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
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
    <div
      id="estrutura-condominio"
      className="scroll-mt-6 rounded-xl bg-white p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          Estrutura — {condominioNome}
        </h2>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Configuração de blocos e unidades
      </p>

      {/* Blocos */}
      <div className="space-y-2">
        {blocos?.map((bloco: Bloco) => (
          <div key={bloco.id} className="rounded-lg border">
            <button
              className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-gray-50"
              onClick={() => toggleBloco(bloco.id)}
            >
              <div className="flex items-center gap-2">
                {expandedBlocos.has(bloco.id) ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-800">
                  {bloco.nome}
                </span>
                <span className="text-xs text-gray-400">
                  ({bloco.unidades.length} unidades)
                </span>
              </div>
            </button>

            {expandedBlocos.has(bloco.id) && (
              <div className="border-t px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {bloco.unidades.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                    >
                      {u.numero}
                    </span>
                  ))}

                  {/* Add unidade inline */}
                  {addingUnidade === bloco.id ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        className="h-7 w-20 text-xs"
                        placeholder="Nº"
                        value={newUnidadeNumero}
                        onChange={(e) => setNewUnidadeNumero(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newUnidadeNumero.trim()) {
                            createUnidadeMutation.mutate({
                              blocoId: bloco.id,
                              numero: newUnidadeNumero.trim(),
                            })
                          }
                          if (e.key === "Escape") {
                            setAddingUnidade(null)
                            setNewUnidadeNumero("")
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        disabled={createUnidadeMutation.isPending}
                        onClick={() => {
                          if (newUnidadeNumero.trim()) {
                            createUnidadeMutation.mutate({
                              blocoId: bloco.id,
                              numero: newUnidadeNumero.trim(),
                            })
                          }
                        }}
                      >
                        {createUnidadeMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "OK"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <button
                      className="inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-500 transition hover:border-emerald-400 hover:text-emerald-600"
                      onClick={() => setAddingUnidade(bloco.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {(!blocos || blocos.length === 0) && (
          <p className="py-4 text-center text-sm text-gray-400">
            Nenhum bloco cadastrado
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-3">
        {addingBloco ? (
          <div className="flex items-center gap-2">
            <Input
              className="h-9 w-48"
              placeholder="Nome do bloco"
              value={newBlocoName}
              onChange={(e) => setNewBlocoName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newBlocoName.trim()) {
                  createBlocoMutation.mutate(newBlocoName.trim())
                }
                if (e.key === "Escape") {
                  setAddingBloco(false)
                  setNewBlocoName("")
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800"
              disabled={createBlocoMutation.isPending}
              onClick={() => {
                if (newBlocoName.trim()) {
                  createBlocoMutation.mutate(newBlocoName.trim())
                }
              }}
            >
              {createBlocoMutation.isPending ? (
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingBloco(true)}
          >
            <DoorOpen className="mr-1.5 h-4 w-4" />
            Adicionar Bloco
          </Button>
        )}
      </div>
    </div>
  )
}

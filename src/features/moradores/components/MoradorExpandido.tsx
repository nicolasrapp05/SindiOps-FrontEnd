import { Mail, Phone, Calendar, Building2, Home } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MORADOR_PAPEL_LABEL, type MoradorPapel } from "../types/morador.types"
import { useMorador } from "../hooks/useMoradores"
import { cn } from "@/lib/utils"

interface MoradorExpandidoProps {
  moradorId: string
}

const PAPEL_CLASS: Record<MoradorPapel, string> = {
  proprietario: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  inquilino: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  ocupante: "bg-gray-100 text-gray-600 hover:bg-gray-100",
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  delivered: { label: "Entregue", className: "bg-emerald-100 text-emerald-700" },
  sent:      { label: "Enviado",  className: "bg-blue-100 text-blue-700"       },
  failed:    { label: "Falhou",   className: "bg-red-100 text-red-700"         },
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function MoradorExpandido({ moradorId }: MoradorExpandidoProps) {
  const { data: morador, isLoading } = useMorador(moradorId)

  if (isLoading) {
    return (
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    )
  }

  if (!morador) return null

  const initials = morador.nome
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="grid gap-6 border-t bg-gray-50/50 p-5 md:grid-cols-2">
      {/* Esquerda: informações */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-foreground">{morador.nome}</p>
            <Badge variant="secondary" className={cn("mt-1 font-medium", PAPEL_CLASS[morador.papel])}>
              {MORADOR_PAPEL_LABEL[morador.papel]}
            </Badge>
            <p className="text-sm text-gray-500">
              Bloco {morador.bloco.nome} · Unidade {morador.unidade.numero}
            </p>
          </div>
        </div>

        <h4 className="text-sm text-muted-foreground">
          Informações de Contato
        </h4>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{morador.email}</span>
          </div>

          {morador.telefone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{morador.telefone}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Bloco {morador.bloco.nome}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Unidade {morador.unidade.numero}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Cadastrado em {formatDateTime(morador.criadoEm)}</span>
          </div>
        </div>
      </div>

      {/* Direita: histórico de emails */}
      <div className="space-y-3">
        <h4 className="text-sm text-muted-foreground">
          Últimos Emails Enviados
        </h4>

        {!morador.ultimosEmails?.length ? (
          <p className="text-sm text-muted-foreground">Nenhum email enviado ainda.</p>
        ) : (
          <div className="space-y-2">
            {morador.ultimosEmails.map((email) => {
              const badge = STATUS_BADGE[email.statusEntrega] ?? {
                label: email.statusEntrega,
                className: "bg-gray-100 text-gray-700",
              }
              return (
                <div
                  key={email.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {email.assunto}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(email.enviadoEm)}
                    </p>
                  </div>
                  <Badge className={`ml-3 shrink-0 border-0 ${badge.className}`}>
                    {badge.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

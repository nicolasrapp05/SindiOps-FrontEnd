import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Send, User, MapPin, Calendar, Eye, Phone,
  AlertTriangle, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Combobox from "@/components/shared/Combobox"
import { useOcorrencia, useUpdateOcorrenciaStatus, useUploadMidia } from "@/features/ocorrencias/hooks/useOcorrencias"
import { deleteMidia } from "@/features/ocorrencias/services/ocorrencias.service"
import OcorrenciaStatusBadge from "@/features/ocorrencias/components/OcorrenciaStatusBadge"
import UploadMidia from "@/features/ocorrencias/components/UploadMidia"
import EnviarComunicacaoModal from "@/features/ocorrencias/components/EnviarComunicacaoModal"
import {
  TIPO_LABEL, ORIGEM_LABEL, TIPO_LOCAL_LABEL,
} from "@/features/ocorrencias/types/ocorrencia.types"
import type { OcorrenciaStatus } from "@/features/ocorrencias/types/ocorrencia.types"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

export default function OcorrenciaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: oc, isLoading, isError } = useOcorrencia(id ?? "")
  const statusMutation = useUpdateOcorrenciaStatus()
  const uploadMutation = useUploadMidia()
  const [comModalOpen, setComModalOpen] = useState(false)
  const [templateTipo, setTemplateTipo] = useState<string | undefined>()

  const handleStatusChange = (status: string) => {
    if (!id) return
    statusMutation.mutate({ id, status: status as OcorrenciaStatus })
  }

  const handleUpload = (file: File, tipo: "image" | "video") => {
    if (!id) return
    uploadMutation.mutate({ ocorrenciaId: id, arquivo: file, tipo })
  }

  const handleRemoveMidia = async (midiaId: string) => {
    if (!id) return
    try {
      await deleteMidia(id, midiaId)
      qc.invalidateQueries({ queryKey: ["ocorrencias", "detail", id] })
      toast.success("Mídia removida")
    } catch {
      toast.error("Erro ao remover mídia")
    }
  }

  const openCom = (tipo?: string) => { setTemplateTipo(tipo); setComModalOpen(true) }

  const moradorInfo = oc?.morador
    ? {
        id: oc.morador.id,
        nome: oc.morador.nome,
        email: oc.morador.email,
        unidade: oc.morador.unidade.numero,
        bloco: oc.bloco?.nome ?? "",
      }
    : undefined

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-60 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !oc) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
        <h2 className="text-lg font-semibold text-gray-900">Erro ao carregar ocorrência</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/ocorrencias")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ocorrencias")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {TIPO_LABEL[oc.tipoOcorrencia]} — {TIPO_LOCAL_LABEL[oc.tipoLocal]}
            </h1>
            <p className="text-sm text-gray-500">
              Registrada em {new Date(oc.criadoEm).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={() => openCom()}>
          <Send className="mr-2 h-4 w-4" /> Enviar Comunicação
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Info card */}
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Informações da Ocorrência</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Tipo:</span>
                <span className="font-medium">{TIPO_LABEL[oc.tipoOcorrencia]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Origem:</span>
                <span className="font-medium">{ORIGEM_LABEL[oc.origem]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Local:</span>
                <span className="font-medium">{TIPO_LOCAL_LABEL[oc.tipoLocal]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Data/Hora:</span>
                <span className="font-medium">
                  {new Date(oc.ocorreuEm).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm sm:col-span-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Registrado por:</span>
                <span className="font-medium">{oc.registradoPor.nome}</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-sm leading-relaxed text-gray-700">{oc.descricao}</p>
            </div>
          </div>

          {/* Mídias */}
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Mídias Anexadas</h2>
            <UploadMidia
              midias={oc.midias ?? []}
              onUpload={handleUpload}
              onRemove={handleRemoveMidia}
              isUploading={uploadMutation.isPending}
            />
          </div>

          {/* Communications timeline */}
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Histórico de Comunicações</h2>
            {!oc.emailLogs?.length ? (
              <p className="py-4 text-sm text-gray-400">Nenhuma comunicação enviada.</p>
            ) : (
              <div className="space-y-3">
                {oc.emailLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="mt-0.5 rounded-full bg-gray-100 p-1.5">
                      <Send className="h-3 w-3 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{log.assunto}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.enviadoEm).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Badge
                      className={
                        log.statusEntrega === "delivered"
                          ? "bg-emerald-100 text-emerald-700"
                          : log.statusEntrega === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {log.statusEntrega === "delivered" ? "Entregue" : log.statusEntrega === "failed" ? "Falhou" : "Enviado"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Morador card */}
          {oc.morador && (
            <div className="rounded-xl border bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Morador Envolvido</h2>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {oc.morador.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{oc.morador.nome}</p>
                  <p className="text-xs text-gray-500">
                    Apt {oc.morador.unidade.numero}
                    {oc.bloco ? ` · ${oc.bloco.nome}` : ""}
                  </p>
                  <p className="text-xs text-gray-400">{oc.morador.email}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 border-t pt-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="h-3 w-3" />
                  <span>—</span>
                </div>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs text-emerald-700" onClick={() => navigate(`/moradores`)}>
                  Ver perfil completo
                </Button>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Ações Rápidas</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => openCom("advertencia")}>
                <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" /> Enviar Advertência
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => openCom("multa")}>
                <AlertTriangle className="mr-2 h-4 w-4 text-red-500" /> Enviar Multa
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => openCom("notificacao_ocorrencia")}>
                <Send className="mr-2 h-4 w-4 text-blue-500" /> Enviar Notificação
              </Button>
            </div>
          </div>

          {/* Status card */}
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Status</h2>
            <div className="mb-3">
              <OcorrenciaStatusBadge status={oc.status} />
            </div>
            <Combobox
              options={[
                { value: "nova", label: "Nova" },
                { value: "em_andamento", label: "Em Andamento" },
                { value: "finalizada", label: "Finalizada" },
                { value: "cancelada", label: "Cancelada" },
              ]}
              value={oc.status}
              onValueChange={handleStatusChange}
              disabled={statusMutation.isPending}
              placeholder="Alterar status..."
            />
            {statusMutation.isPending && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Atualizando...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Communication Modal */}
      <EnviarComunicacaoModal
        open={comModalOpen}
        onOpenChange={setComModalOpen}
        ocorrenciaId={id ?? ""}
        moradorPadrao={moradorInfo}
        templateTipoPadrao={templateTipo}
      />
    </div>
  )
}

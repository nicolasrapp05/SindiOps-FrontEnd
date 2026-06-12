import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  ORIGEM_LABEL,
  TIPO_LABEL,
  TIPO_LOCAL_LABEL,
} from "../types/ocorrencia.types"
import type { CreateOcorrenciaRequest, OcorrenciaOrigem, OcorrenciaTipo, TipoLocal } from "../types/ocorrencia.types"
import { getBlocos } from "@/features/condominios/services/condominios.service"
import type { Bloco } from "@/features/condominios/types/condominio.types"
import { useMoradores } from "@/features/moradores/hooks/useMoradores"
import type { Morador } from "@/features/moradores/types/morador.types"
import Combobox from "@/components/shared/Combobox"

const formSchema = z.object({
  origem: z.string().min(1, "Obrigatório"),
  tipoLocal: z.string().min(1, "Obrigatório"),
  tipoOcorrencia: z.string().min(1, "Obrigatório"),
  ocorreuEm: z.string().min(1, "Obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  moradorId: z.string().optional().or(z.literal("")),
  blocoId: z.string().optional().or(z.literal("")),
  unidadeId: z.string().optional().or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

interface OcorrenciaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  condominioId: string
  onSubmit: (data: CreateOcorrenciaRequest) => void
  isSubmitting: boolean
}

export default function OcorrenciaForm({
  open, onOpenChange, condominioId, onSubmit, isSubmitting,
}: OcorrenciaFormProps) {
  const [selectedBlocoId, setSelectedBlocoId] = useState("")

  const { data: blocosData } = useQuery({
    queryKey: ["condominios", condominioId, "blocos"],
    queryFn: () => getBlocos(condominioId),
    enabled: open && !!condominioId,
  })
  const blocos: Bloco[] = Array.isArray(blocosData) ? blocosData : []
  const selectedBloco = blocos.find((b) => b.id === selectedBlocoId)
  const unidades = selectedBloco?.unidades ?? []

  const { data: moradoresData } = useMoradores(condominioId, { pageSize: 500 })
  const moradores: Morador[] = moradoresData?.data ?? []

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origem: "", tipoLocal: "", tipoOcorrencia: "", ocorreuEm: "",
      descricao: "", moradorId: "", blocoId: "", unidadeId: "",
    },
  })

  useEffect(() => {
    if (open) {
      reset()
      setSelectedBlocoId("")
    }
  }, [open, reset])

  const handleMoradorChange = (moradorId: string) => {
    setValue("moradorId", moradorId)
    if (!moradorId) return
    const morador = moradores.find((m) => m.id === moradorId)
    if (!morador) return
    setValue("blocoId", morador.bloco.id)
    setSelectedBlocoId(morador.bloco.id)
    setValue("unidadeId", morador.unidade.id)
  }

  const handleBlocoChange = (blocoId: string) => {
    setValue("blocoId", blocoId)
    setSelectedBlocoId(blocoId)
    setValue("unidadeId", "")
    setValue("moradorId", "")
  }

  const handleUnidadeChange = (unidadeId: string) => {
    setValue("unidadeId", unidadeId)
    if (!unidadeId) {
      setValue("moradorId", "")
      return
    }
    const morador = moradores.find((m) => m.unidade.id === unidadeId)
    if (morador) setValue("moradorId", morador.id)
  }

  const onFormSubmit = (data: FormData) => {
    onSubmit({
      condominioId,
      origem: data.origem as OcorrenciaOrigem,
      tipoLocal: data.tipoLocal as TipoLocal,
      tipoOcorrencia: data.tipoOcorrencia as OcorrenciaTipo,
      descricao: data.descricao,
      ocorreuEm: data.ocorreuEm,
      moradorId: data.moradorId || undefined,
      blocoId: data.blocoId || undefined,
      unidadeId: data.unidadeId || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Ocorrência</DialogTitle>
          <DialogDescription>Registre uma nova ocorrência no condomínio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Origem<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
              <Controller control={control} name="origem" render={({ field }) => (
                <Combobox
                  options={Object.entries(ORIGEM_LABEL).map(([k, v]) => ({ value: k, label: v }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecionar origem..."
                />
              )} />
              {errors.origem && <p className="text-xs text-destructive">{errors.origem.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Local<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
              <Controller control={control} name="tipoLocal" render={({ field }) => (
                <Combobox
                  options={Object.entries(TIPO_LOCAL_LABEL).map(([k, v]) => ({ value: k, label: v }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecionar tipo de local..."
                />
              )} />
              {errors.tipoLocal && <p className="text-xs text-destructive">{errors.tipoLocal.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de Ocorrência<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
              <Controller control={control} name="tipoOcorrencia" render={({ field }) => (
                <Combobox
                  options={Object.entries(TIPO_LABEL).map(([k, v]) => ({ value: k, label: v }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecionar tipo..."
                />
              )} />
              {errors.tipoOcorrencia && <p className="text-xs text-destructive">{errors.tipoOcorrencia.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Data e Hora<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
              <Input type="datetime-local" {...register("ocorreuEm")} />
              {errors.ocorreuEm && <p className="text-xs text-destructive">{errors.ocorreuEm.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição<span className="text-destructive ml-0.5 relative top-[2px]">*</span></Label>
            <Textarea placeholder="Descreva a ocorrência em detalhes..." rows={4} {...register("descricao")} />
            {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
          </div>

          {/* Localização e morador (opcionais) */}
          <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Localização e morador (opcional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bloco</Label>
                <Controller
                  control={control}
                  name="blocoId"
                  render={({ field }) => (
                    <Combobox
                      options={[
                        { value: "", label: "Nenhum" },
                        ...blocos.map((b) => ({ value: b.id, label: b.nome })),
                      ]}
                      value={field.value || ""}
                      onValueChange={handleBlocoChange}
                      placeholder="Buscar bloco..."
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Controller
                  control={control}
                  name="unidadeId"
                  render={({ field }) => (
                    <Combobox
                      options={[
                        { value: "", label: "Nenhuma" },
                        ...unidades.map((u) => ({ value: u.id, label: u.numero })),
                      ]}
                      value={field.value || ""}
                      onValueChange={handleUnidadeChange}
                      placeholder="Buscar unidade..."
                      disabled={!selectedBlocoId}
                    />
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Morador</Label>
              <Controller
                control={control}
                name="moradorId"
                render={({ field }) => (
                  <Combobox
                    options={[
                      { value: "", label: "Nenhum" },
                      ...moradores.map((m) => ({ value: m.id, label: m.nome })),
                    ]}
                    value={field.value || ""}
                    onValueChange={handleMoradorChange}
                    placeholder="Buscar morador..."
                  />
                )}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Ocorrência
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

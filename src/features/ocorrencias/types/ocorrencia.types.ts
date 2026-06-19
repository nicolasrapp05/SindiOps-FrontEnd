export type OcorrenciaStatus = "nova" | "em_andamento" | "finalizada" | "cancelada"

export type OcorrenciaOrigem =
  | "reclamacao_morador"
  | "reclamacao_funcionario"
  | "reclamacao_terceiros"
  | "fora_de_norma"

export type OcorrenciaTipo =
  | "barulho"
  | "pets"
  | "garagem"
  | "alteracao_fachada"
  | "objetos_corredores"
  | "objetos_janelas_sacadas"
  | "outro"

export type TipoLocal =
  | "area_comum"
  | "estacionamento"
  | "portaria"
  | "jardim"
  | "salao_festas"
  | "hall"
  | "corredores"
  | "vizinhos"
  | "outro"

export const STATUS_LABEL: Record<OcorrenciaStatus, string> = {
  nova: "Nova",
  em_andamento: "Em Andamento",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
}

export const ORIGEM_LABEL: Record<OcorrenciaOrigem, string> = {
  reclamacao_morador: "Morador",
  reclamacao_funcionario: "Funcionário",
  reclamacao_terceiros: "Terceiros",
  fora_de_norma: "Fora de norma",
}

export const TIPO_LABEL: Record<OcorrenciaTipo, string> = {
  barulho: "Barulho",
  pets: "Pets",
  garagem: "Garagem",
  alteracao_fachada: "Fachada",
  objetos_corredores: "Objetos Corredores",
  objetos_janelas_sacadas: "Objetos Janelas/Sacadas",
  outro: "Outro",
}

export const TIPO_LOCAL_LABEL: Record<TipoLocal, string> = {
  area_comum: "Área Comum",
  estacionamento: "Estacionamento",
  portaria: "Portaria",
  jardim: "Jardim",
  salao_festas: "Salão de Festas",
  hall: "Hall",
  corredores: "Corredores",
  vizinhos: "Vizinhos",
  outro: "Outro",
}

export interface MidiaOcorrencia {
  id: string
  signedUrl: string
  tipoArquivo: "image" | "video"
  expiresAt: string
}

export interface EmailLogResumo {
  id: string
  assunto: string
  enviadoEm: string
  statusEntrega: "sent" | "delivered" | "failed"
}

export interface Ocorrencia {
  id: string
  condominioId: string
  origem: OcorrenciaOrigem
  tipoLocal: TipoLocal
  tipoOcorrencia: OcorrenciaTipo
  descricao: string
  status: OcorrenciaStatus
  ocorreuEm: string
  morador?: { id: string; nome: string; email: string; telefone?: string; unidade: { numero: string } }
  bloco?: { id: string; nome: string }
  unidade?: { id: string; numero: string }
  registradoPor: { id: string; nome: string }
  totalMidias?: number
  midias?: MidiaOcorrencia[]
  emailLogs?: EmailLogResumo[]
  criadoEm: string
}

export interface CreateOcorrenciaRequest {
  condominioId: string
  origem: OcorrenciaOrigem
  tipoLocal: TipoLocal
  tipoOcorrencia: OcorrenciaTipo
  descricao: string
  ocorreuEm: string
  moradorId?: string
  blocoId?: string
  unidadeId?: string
}

export interface OcorrenciasFilters {
  search?: string
  status?: OcorrenciaStatus
  origem?: OcorrenciaOrigem
  tipoOcorrencia?: OcorrenciaTipo
  dataInicio?: string
  dataFim?: string
  page?: number
  pageSize?: number
}

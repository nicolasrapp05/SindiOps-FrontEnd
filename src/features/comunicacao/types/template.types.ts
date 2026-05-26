export type TemplateTipo =
  | "advertencia"
  | "multa"
  | "notificacao_ocorrencia"
  | "comunicado_geral"
  | "notificacao_manutencao"

export const TEMPLATE_TIPO_LABEL: Record<TemplateTipo, string> = {
  advertencia: "Advertência",
  multa: "Multa",
  notificacao_ocorrencia: "Notificação de Ocorrência",
  comunicado_geral: "Comunicado Geral",
  notificacao_manutencao: "Notificação de Manutenção",
}

export const VARIAVEIS_DISPONIVEIS = [
  { token: "{{nome_morador}}", descricao: "Nome do morador" },
  { token: "{{unidade}}", descricao: "Número da unidade" },
  { token: "{{bloco}}", descricao: "Bloco" },
  { token: "{{condominio}}", descricao: "Nome do condomínio" },
  { token: "{{data_ocorrencia}}", descricao: "Data da ocorrência" },
  { token: "{{descricao_ocorrencia}}", descricao: "Descrição da ocorrência" },
  { token: "{{tipo_ocorrencia}}", descricao: "Tipo da ocorrência" },
  { token: "{{nome_sindico}}", descricao: "Nome do síndico" },
  { token: "{{valor_multa}}", descricao: "Valor da multa (R$)" },
  { token: "{{data_envio}}", descricao: "Data do envio" },
  { token: "{{prazo_resposta}}", descricao: "Prazo para resposta" },
]

export interface EmailTemplate {
  id: string
  nome: string
  tipo: TemplateTipo
  assunto: string
  corpo: string
  criadoEm: string
  atualizadoEm: string
}

export interface CreateTemplateRequest {
  nome: string
  tipo: TemplateTipo
  assunto: string
  corpo: string
}

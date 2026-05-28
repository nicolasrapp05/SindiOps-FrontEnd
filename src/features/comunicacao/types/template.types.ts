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
  {
    token: "{{nome_morador}}",
    descricao: "Nome do morador",
    fonte: "Cadastro do morador destinatário do e-mail.",
  },
  {
    token: "{{unidade}}",
    descricao: "Número da unidade",
    fonte: "Unidade vinculada ao morador no condomínio.",
  },
  {
    token: "{{bloco}}",
    descricao: "Bloco",
    fonte: "Bloco ao qual a unidade do morador pertence.",
  },
  {
    token: "{{condominio}}",
    descricao: "Nome do condomínio",
    fonte: "Condomínio selecionado no momento do envio.",
  },
  {
    token: "{{data_ocorrencia}}",
    descricao: "Data da ocorrência",
    fonte: "Data registrada na ocorrência vinculada ao e-mail.",
  },
  {
    token: "{{descricao_ocorrencia}}",
    descricao: "Descrição da ocorrência",
    fonte: "Texto descritivo da ocorrência vinculada ao e-mail.",
  },
  {
    token: "{{tipo_ocorrencia}}",
    descricao: "Tipo da ocorrência",
    fonte: "Categoria da ocorrência (ex.: barulho, dano, etc.).",
  },
  {
    token: "{{nome_sindico}}",
    descricao: "Nome do síndico",
    fonte: "Nome do usuário síndico logado que enviou o e-mail.",
  },
  {
    token: "{{valor_multa}}",
    descricao: "Valor da multa (R$)",
    fonte: "Valor em reais definido na multa associada ao envio.",
  },
  {
    token: "{{data_envio}}",
    descricao: "Data do envio",
    fonte: "Gerada automaticamente com a data em que o e-mail é disparado.",
  },
  {
    token: "{{prazo_resposta}}",
    descricao: "Prazo para resposta",
    fonte: "Prazo (em dias ou data) definido na multa ou notificação.",
  },
]

export interface EmailTemplate {
  id: string
  nome: string
  tipo: TemplateTipo
  assunto: string
  corpo: string
  criadoEm: string
  atualizadoEm: string | null
}

export interface CreateTemplateRequest {
  nome: string
  tipo: TemplateTipo
  assunto: string
  corpo: string
}

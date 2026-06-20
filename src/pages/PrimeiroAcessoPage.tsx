import { Link } from "react-router-dom"
import PasswordRecoveryFlow, {
  type PasswordRecoveryCopy,
} from "@/features/auth/components/PasswordRecoveryFlow"

const copy: PasswordRecoveryCopy = {
  loadingTitle: "Primeiro acesso",
  loadingSubtitle: "Validando seu convite…",
  invalidTitle: "Convite inválido ou expirado",
  invalidSubtitle: "Use o botão do email de convite ou informe o código numérico recebido.",
  invalidAlert:
    "O link pode ter expirado ou já ter sido usado. Clique novamente em “Ativar meu acesso” no email mais recente ou preencha o código abaixo.",
  invalidFooter: (
    <p className="text-center text-sm text-gray-500">
      <Link to="/login" className="font-medium text-emerald-700 hover:underline">
        Voltar ao login
      </Link>
    </p>
  ),
  otpSectionTitle: "Ativar com código do email",
  otpSectionHint: "Informe o email convidado e o código numérico recebido no convite mais recente.",
  otpCodeLabel: "Código de ativação",
  otpSubmitLabel: "Ativar conta e salvar senha",
  otpErrorFallback: "Código inválido ou expirado",
  passwordErrorFallback: "Erro ao definir senha",
  readyTitle: "Defina sua senha",
  readySubtitle: "Seu convite foi validado. Escolha uma senha para concluir a ativação do seu acesso.",
  passwordLabel: "Senha",
  confirmPasswordLabel: "Confirmar senha",
  readySubmitLabel: "Concluir primeiro acesso",
  successShellTitle: "Conta ativada",
  successShellSubtitle: "Tudo certo! Faça login para acessar o sistema.",
  successHeading: "Acesso ativado com sucesso",
  successMessage:
    "Sua senha foi definida. Agora você pode entrar na plataforma com o email convidado e a senha escolhida.",
  successButtonLabel: "Ir para o login",
}

export default function PrimeiroAcessoPage() {
  return <PasswordRecoveryFlow copy={copy} />
}

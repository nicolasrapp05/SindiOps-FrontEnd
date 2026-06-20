import { Link } from "react-router-dom"
import PasswordRecoveryFlow, {
  type PasswordRecoveryCopy,
} from "@/features/auth/components/PasswordRecoveryFlow"

const copy: PasswordRecoveryCopy = {
  loadingTitle: "Redefinir senha",
  loadingSubtitle: "Validando seu link de recuperação…",
  invalidTitle: "Link inválido ou expirado",
  invalidSubtitle: `Use o botão do email mais recente ou informe o código numérico recebido.`,
  invalidAlert:
    "O link pode ter expirado ou já ter sido usado. Clique novamente no botão do email mais recente ou preencha o código abaixo como alternativa.",
  invalidFooter: (
    <p className="text-center text-sm text-gray-500">
      <Link to="/esqueci-senha" className="font-medium text-emerald-700 hover:underline">
        Solicitar novo email
      </Link>
      {" · "}
      <Link to="/login" className="font-medium text-emerald-700 hover:underline">
        Voltar ao login
      </Link>
    </p>
  ),
  otpSectionTitle: "Redefinir com código do email",
  otpSectionHint: "Informe o email da conta e o código numérico do email de recuperação mais recente.",
  otpCodeLabel: "Código de verificação",
  otpSubmitLabel: "Validar código e salvar senha",
  otpErrorFallback: "Código inválido ou expirado",
  passwordErrorFallback: "Erro ao redefinir senha",
  readyTitle: "Nova senha",
  readySubtitle: "Seu link foi validado. Escolha uma nova senha para acessar sua conta.",
  passwordLabel: "Nova senha",
  confirmPasswordLabel: "Confirmar nova senha",
  readySubmitLabel: "Salvar nova senha",
  successShellTitle: "Senha atualizada",
  successShellSubtitle: "Tudo certo! Faça login com sua nova senha.",
  successHeading: "Senha redefinida com sucesso",
  successMessage:
    "Sua nova senha foi salva. Agora você pode entrar na plataforma com suas credenciais atualizadas.",
  successButtonLabel: "Voltar ao login",
}

export default function RedefinirSenhaPage() {
  return <PasswordRecoveryFlow copy={copy} />
}

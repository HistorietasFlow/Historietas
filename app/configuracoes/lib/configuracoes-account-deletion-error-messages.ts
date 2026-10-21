import type { HistorietasLanguage } from "../../../lib/i18n";
import { textoIdioma } from "./configuracoes-search-utils";

export function traduzirErroExclusaoContaConfiguracoes(
  codigo: string,
  mensagem: string,
  language: HistorietasLanguage,
) {
  const mensagens: Record<string, [string, string, string]> = {
    senha_obrigatoria: [
      "Digite sua senha atual.",
      "Enter your current password.",
      "Escribe tu contraseña actual.",
    ],
    confirmacao_invalida: [
      "Digite EXCLUIR exatamente como aparece para confirmar.",
      "Type DELETE exactly as shown to confirm.",
      "Escribe ELIMINAR exactamente como aparece para confirmar.",
    ],
    senha_incorreta: [
      "A senha atual está incorreta.",
      "The current password is incorrect.",
      "La contraseña actual es incorrecta.",
    ],
    muitas_tentativas: [
      "Muitas tentativas de confirmação. Aguarde antes de tentar novamente.",
      "Too many confirmation attempts. Wait before trying again.",
      "Demasiados intentos de confirmación. Espera antes de volver a intentarlo.",
    ],
    protecao_indisponivel: [
      "Não foi possível validar a segurança da operação agora. Tente novamente.",
      "The operation's security could not be validated right now. Try again.",
      "No se pudo validar la seguridad de la operación ahora. Inténtalo de nuevo.",
    ],
    conta_nao_autenticada: [
      "Sua sessão expirou. Entre novamente e tente de novo.",
      "Your session has expired. Sign in again and try once more.",
      "Tu sesión expiró. Inicia sesión de nuevo e inténtalo otra vez.",
    ],
    configuracao_servidor: [
      "A exclusão ainda não foi configurada no servidor. Verifique a chave SUPABASE_SERVICE_ROLE_KEY na Vercel.",
      "Account deletion has not been configured on the server yet. Check SUPABASE_SERVICE_ROLE_KEY in Vercel.",
      "La eliminación aún no está configurada en el servidor. Revisa SUPABASE_SERVICE_ROLE_KEY en Vercel.",
    ],
    exclusao_falhou: [
      "Não foi possível excluir sua conta agora. Tente novamente ou use a página pública de exclusão.",
      "Your account could not be deleted right now. Try again or use the public deletion page.",
      "No se pudo eliminar tu cuenta ahora. Inténtalo de nuevo o usa la página pública de eliminación.",
    ],
  };
  const traducao = mensagens[codigo];

  return traducao ? textoIdioma(language, ...traducao) : mensagem;
}

import type { HistorietasLanguage } from "../../../lib/i18n";
import { textoIdioma } from "./configuracoes-search-utils";

export function validarExclusaoContaConfiguracoes(
  senha: string,
  confirmacao: string,
  language: HistorietasLanguage,
) {
  if (!senha) {
    return textoIdioma(
      language,
      "Digite sua senha atual.",
      "Enter your current password.",
      "Escribe tu contraseña actual.",
    );
  }

  const confirmacaoEsperada =
    language === "en" ? "DELETE" : language === "es" ? "ELIMINAR" : "EXCLUIR";

  if (confirmacao.trim().toUpperCase() !== confirmacaoEsperada) {
    return textoIdioma(
      language,
      "Digite EXCLUIR exatamente como aparece para confirmar.",
      "Type DELETE exactly as shown to confirm.",
      "Escribe ELIMINAR exactamente como aparece para confirmar.",
    );
  }

  return "";
}

export function validarAlteracaoSenhaConfiguracoes(
  senhaAtual: string,
  novaSenha: string,
  confirmarNovaSenha: string,
  language: HistorietasLanguage,
) {
  if (!senhaAtual) {
    return textoIdioma(
      language,
      "Digite sua senha atual.",
      "Enter your current password.",
      "Escribe tu contraseña actual.",
    );
  }

  if (novaSenha.length < 8) {
    return textoIdioma(
      language,
      "A nova senha precisa ter pelo menos 8 caracteres.",
      "The new password must be at least 8 characters long.",
      "La nueva contraseña debe tener al menos 8 caracteres.",
    );
  }

  if (
    !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(novaSenha) ||
    !/[0-9]/.test(novaSenha)
  ) {
    return textoIdioma(
      language,
      "Use pelo menos uma letra e um número na nova senha.",
      "Use at least one letter and one number in the new password.",
      "Usa al menos una letra y un número en la nueva contraseña.",
    );
  }

  if (novaSenha === senhaAtual) {
    return textoIdioma(
      language,
      "A nova senha precisa ser diferente da senha atual.",
      "The new password must be different from the current password.",
      "La nueva contraseña debe ser diferente de la contraseña actual.",
    );
  }

  if (novaSenha !== confirmarNovaSenha) {
    return textoIdioma(
      language,
      "A confirmação não corresponde à nova senha.",
      "The confirmation does not match the new password.",
      "La confirmación no coincide con la nueva contraseña.",
    );
  }

  return "";
}

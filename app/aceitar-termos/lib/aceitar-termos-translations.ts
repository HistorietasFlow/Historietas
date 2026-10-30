import type { HistorietasLanguage } from "../../../lib/i18n";

export type ChaveTexto =
  | "titulo"
  | "descricao"
  | "termos"
  | "diretrizes"
  | "privacidade"
  | "confirmacaoTermos"
  | "confirmacaoPrivacidade"
  | "aceitarContinuar"
  | "aguarde"
  | "jaAceito"
  | "continuar"
  | "erroLogin"
  | "erroMarcar"
  | "voltar";

export const TEXTOS: Record<HistorietasLanguage, Record<ChaveTexto, string>> = {
  "pt-BR": {
    titulo: "ACEITE PARA PUBLICAR",
    descricao:
      "Antes de publicar obras, capítulos ou posts, confirme que leu e concorda com as regras atuais do Historietas.",
    termos: "Termos de Uso",
    diretrizes: "Diretrizes da Comunidade",
    privacidade: "Política de Privacidade",
    confirmacaoTermos:
      "Li e aceito os Termos de Uso e as Diretrizes da Comunidade.",
    confirmacaoPrivacidade:
      "Li e estou ciente da Política de Privacidade.",
    aceitarContinuar: "ACEITAR E CONTINUAR",
    aguarde: "AGUARDE...",
    jaAceito: "Seu aceite já está atualizado.",
    continuar: "CONTINUAR",
    erroLogin: "Entre na sua conta para registrar o aceite.",
    erroMarcar: "Marque as duas confirmações para continuar.",
    voltar: "Voltar",
  },
  en: {
    titulo: "ACCEPTANCE REQUIRED TO PUBLISH",
    descricao:
      "Before publishing works, chapters, or posts, confirm that you have read and agree to the current Historietas rules.",
    termos: "Terms of Use",
    diretrizes: "Community Guidelines",
    privacidade: "Privacy Policy",
    confirmacaoTermos:
      "I have read and accept the Terms of Use and Community Guidelines.",
    confirmacaoPrivacidade: "I have read and acknowledge the Privacy Policy.",
    aceitarContinuar: "ACCEPT AND CONTINUE",
    aguarde: "PLEASE WAIT...",
    jaAceito: "Your acceptance is already up to date.",
    continuar: "CONTINUE",
    erroLogin: "Sign in to record your acceptance.",
    erroMarcar: "Select both confirmations to continue.",
    voltar: "Back",
  },
  es: {
    titulo: "ACEPTACIÓN PARA PUBLICAR",
    descricao:
      "Antes de publicar obras, capítulos o posts, confirma que leíste y aceptas las reglas actuales de Historietas.",
    termos: "Términos de Uso",
    diretrizes: "Normas de la Comunidad",
    privacidade: "Política de Privacidad",
    confirmacaoTermos:
      "He leído y acepto los Términos de Uso y las Normas de la Comunidad.",
    confirmacaoPrivacidade:
      "He leído y conozco la Política de Privacidad.",
    aceitarContinuar: "ACEPTAR Y CONTINUAR",
    aguarde: "ESPERA...",
    jaAceito: "Tu aceptación ya está actualizada.",
    continuar: "CONTINUAR",
    erroLogin: "Inicia sesión para registrar la aceptación.",
    erroMarcar: "Marca las dos confirmaciones para continuar.",
    voltar: "Volver",
  },
};

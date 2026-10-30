"use client";

import Link from "next/link";
import { useState } from "react";
import { useHistorietasLanguage } from "@/components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "@/lib/historietasTheme";
import { useExcluirContaRequestAction } from "./hooks/use-excluir-conta-request-action";
import { excluirContaPageCss } from "./styles/excluir-conta-page-css";

export default function ExcluirContaPage() {
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme({
    minHeight: "100dvh",
    background: "var(--historietas-page-background, #050509)",
    color: "var(--historietas-text-primary, #fff)",
  });
  const [email, setEmail] = useState("");
  const [motivo, setMotivo] = useState("");
  const [confirmacao, setConfirmacao] = useState(false);
  const [website, setWebsite] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);

  function t(pt: string, en: string, es: string) {
    return language === "en" ? en : language === "es" ? es : pt;
  }

  const { enviarSolicitacao } = useExcluirContaRequestAction({
    email,
    motivo,
    confirmacao,
    website,
    enviando,
    t,
    setEmail,
    setMotivo,
    setConfirmacao,
    setWebsite,
    setEnviando,
    setErro,
    setEnviado,
  });

  return (
    <main style={pageThemeStyle} className="exclusao-conta-page">
      <style>{`${historietasThemeCss}${excluirContaPageCss}`}</style>

      <div className="exclusao-conta-shell">
        <Link href="/" className="exclusao-conta-voltar">
          ← {t("Voltar ao Historietas", "Back to Historietas", "Volver a Historietas")}
        </Link>

        <section className="exclusao-conta-hero">
          <span className="exclusao-conta-selo">
            {t("Privacidade e conta", "Privacy and account", "Privacidad y cuenta")}
          </span>
          <h1>{t("Excluir conta do Historietas", "Delete your Historietas account", "Eliminar tu cuenta de Historietas")}</h1>
          <p>
            {t(
              "Você pode excluir sua conta imediatamente dentro das Configurações. Caso não consiga entrar, use o formulário abaixo para solicitar a exclusão.",
              "You can delete your account immediately from Settings. If you cannot sign in, use the form below to request deletion.",
              "Puedes eliminar tu cuenta inmediatamente desde Configuración. Si no puedes iniciar sesión, usa el formulario siguiente para solicitar la eliminación.",
            )}
          </p>
        </section>

        <section className="exclusao-conta-card exclusao-conta-card-destaque">
          <h2>{t("Exclusão imediata", "Immediate deletion", "Eliminación inmediata")}</h2>
          <p>
            {t(
              "Entre na sua conta e acesse Configurações → Zona de risco → Excluir minha conta. Será necessário confirmar sua senha e digitar EXCLUIR.",
              "Sign in and open Settings → Danger zone → Delete my account. You will need to confirm your password and type DELETE.",
              "Inicia sesión y abre Configuración → Zona de riesgo → Eliminar mi cuenta. Tendrás que confirmar tu contraseña y escribir ELIMINAR.",
            )}
          </p>
          <div className="exclusao-conta-acoes">
            <Link href="/login" className="exclusao-conta-botao primario">
              {t("Entrar na conta", "Sign in", "Iniciar sesión")}
            </Link>
            <Link href="/configuracoes" className="exclusao-conta-botao secundario">
              {t("Abrir Configurações", "Open Settings", "Abrir Configuración")}
            </Link>
          </div>
        </section>

        <section className="exclusao-conta-card">
          <h2>{t("O que será apagado", "What will be deleted", "Qué se eliminará")}</h2>
          <ul>
            <li>{t("Conta, perfil e dados de autenticação.", "Account, profile, and authentication data.", "Cuenta, perfil y datos de autenticación.")}</li>
            <li>{t("Obras, capítulos, capas, arquivos e conteúdo publicado.", "Works, chapters, covers, files, and published content.", "Obras, capítulos, portadas, archivos y contenido publicado.")}</li>
            <li>{t("Comentários, avaliações, curtidas, seguidores e progresso de leitura.", "Comments, ratings, likes, followers, and reading progress.", "Comentarios, valoraciones, me gusta, seguidores y progreso de lectura.")}</li>
          </ul>
          <p className="exclusao-conta-aviso">
            {t(
              "A exclusão é permanente. Informações que precisem ser mantidas por obrigação legal, segurança ou prevenção de fraude poderão ser retidas pelo período necessário e de forma limitada.",
              "Deletion is permanent. Information required for legal, security, or fraud-prevention reasons may be retained for the necessary period and in a limited form.",
              "La eliminación es permanente. La información necesaria por motivos legales, de seguridad o prevención de fraude podrá conservarse durante el periodo necesario y de forma limitada.",
            )}
          </p>
        </section>

        <section className="exclusao-conta-card">
          <h2>{t("Solicitar sem entrar", "Request without signing in", "Solicitar sin iniciar sesión")}</h2>
          <p>
            {t(
              "Informe o mesmo e-mail usado na conta. Antes de concluir a exclusão, o Historietas poderá pedir uma verificação de identidade.",
              "Enter the same email used for the account. Before completing deletion, Historietas may request identity verification.",
              "Indica el mismo correo utilizado en la cuenta. Antes de completar la eliminación, Historietas podrá solicitar una verificación de identidad.",
            )}
          </p>

          {enviado ? (
            <div className="exclusao-conta-sucesso" role="status">
              <strong>{t("Solicitação registrada", "Request registered", "Solicitud registrada")}</strong>
              <span>{t("Guarde esta página e acompanhe o e-mail informado.", "Keep this page and watch the email you provided.", "Guarda esta página y revisa el correo informado.")}</span>
            </div>
          ) : (
            <form onSubmit={enviarSolicitacao} className="exclusao-conta-form">
              <label className="exclusao-conta-honeypot" aria-hidden="true">
                <span>Website</span>
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  autoComplete="off"
                  tabIndex={-1}
                />
              </label>

              <label>
                <span>{t("E-mail da conta", "Account email", "Correo de la cuenta")}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </label>

              <label>
                <span>{t("Motivo (opcional)", "Reason (optional)", "Motivo (opcional)")}</span>
                <textarea
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  maxLength={1000}
                  rows={4}
                />
              </label>

              <label className="exclusao-conta-checkbox">
                <input
                  type="checkbox"
                  checked={confirmacao}
                  onChange={(event) => setConfirmacao(event.target.checked)}
                  required
                />
                <span>{t("Confirmo que desejo solicitar a exclusão permanente da conta e dos dados associados.", "I confirm that I want to request permanent deletion of the account and associated data.", "Confirmo que deseo solicitar la eliminación permanente de la cuenta y los datos asociados.")}</span>
              </label>

              {erro ? <div className="exclusao-conta-erro" role="alert">{erro}</div> : null}

              <button type="submit" disabled={enviando} className="exclusao-conta-enviar">
                {enviando
                  ? t("Enviando...", "Sending...", "Enviando...")
                  : t("Solicitar exclusão", "Request deletion", "Solicitar eliminación")}
              </button>
            </form>
          )}
        </section>

        <p className="exclusao-conta-rodape">
          <Link href="/politica-de-privacidade">{t("Política de Privacidade", "Privacy Policy", "Política de Privacidad")}</Link>
          <span>•</span>
          <Link href="/termos">{t("Termos de Uso", "Terms of Use", "Términos de Uso")}</Link>
        </p>
      </div>
    </main>
  );
}

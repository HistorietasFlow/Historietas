"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useHistorietasLanguage } from "@/components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "@/lib/historietasTheme";

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

  async function enviarSolicitacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enviando) return;

    setErro("");
    setEnviando(true);

    try {
      const response = await fetch("/api/conta/solicitar-exclusao", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          motivo,
          confirmacao,
          website,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; mensagem?: string }
        | null;

      if (!response.ok || !data?.ok) {
        setErro(
          data?.mensagem ||
            t(
              "Não foi possível registrar sua solicitação agora.",
              "Your request could not be registered right now.",
              "No se pudo registrar tu solicitud ahora.",
            ),
        );
        return;
      }

      setEnviado(true);
      setEmail("");
      setMotivo("");
      setConfirmacao(false);
      setWebsite("");
    } catch {
      setErro(
        t(
          "Não foi possível registrar sua solicitação agora.",
          "Your request could not be registered right now.",
          "No se pudo registrar tu solicitud ahora.",
        ),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main style={pageThemeStyle} className="exclusao-conta-page">
      <style>{`${historietasThemeCss}${pageCss}`}</style>

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

const pageCss = `
  .exclusao-conta-page { padding: 28px 18px 120px; box-sizing: border-box; }
  .exclusao-conta-shell { width: min(760px, 100%); margin: 0 auto; display: grid; gap: 18px; }
  .exclusao-conta-voltar { color: var(--historietas-text-secondary, #c4b5fd); text-decoration: none; font-weight: 750; }
  .exclusao-conta-hero { padding: 18px 2px 4px; }
  .exclusao-conta-selo { display: inline-flex; padding: 7px 11px; border-radius: 999px; background: rgba(139,92,246,.16); border: 1px solid rgba(167,139,250,.28); color: #ddd6fe; font-size: 12px; font-weight: 850; text-transform: uppercase; letter-spacing: .04em; }
  .exclusao-conta-hero h1 { margin: 15px 0 9px; font-size: clamp(30px, 7vw, 48px); line-height: 1; letter-spacing: -.045em; }
  .exclusao-conta-hero p, .exclusao-conta-card p { color: var(--historietas-text-secondary, rgba(255,255,255,.67)); line-height: 1.55; }
  .exclusao-conta-card { padding: 22px; border-radius: 22px; background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.09); box-shadow: 0 18px 60px rgba(0,0,0,.24); }
  .exclusao-conta-card-destaque { border-color: rgba(167,139,250,.28); background: linear-gradient(180deg, rgba(91,33,182,.18), rgba(255,255,255,.04)); }
  .exclusao-conta-card h2 { margin: 0 0 8px; font-size: 21px; }
  .exclusao-conta-card ul { padding-left: 22px; color: rgba(255,255,255,.8); line-height: 1.55; }
  .exclusao-conta-aviso { padding: 13px 14px; border-radius: 14px; background: rgba(127,29,29,.18); border: 1px solid rgba(248,113,113,.25); color: #fecaca !important; }
  .exclusao-conta-acoes { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
  .exclusao-conta-botao, .exclusao-conta-enviar { min-height: 46px; padding: 11px 16px; border: 0; border-radius: 13px; display: inline-flex; align-items: center; justify-content: center; font: inherit; font-weight: 850; text-decoration: none; cursor: pointer; }
  .exclusao-conta-botao.primario, .exclusao-conta-enviar { background: var(--historietas-accent, #8b5cf6); color: #fff; }
  .exclusao-conta-botao.secundario { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); color: #fff; }
  .exclusao-conta-form { display: grid; gap: 15px; margin-top: 18px; }
  .exclusao-conta-honeypot { position: absolute !important; left: -10000px !important; width: 1px !important; height: 1px !important; overflow: hidden !important; opacity: 0 !important; pointer-events: none !important; }
  .exclusao-conta-form label:not(.exclusao-conta-checkbox) { display: grid; gap: 7px; color: rgba(255,255,255,.75); font-size: 13px; font-weight: 800; }
  .exclusao-conta-form input[type=email], .exclusao-conta-form textarea { width: 100%; box-sizing: border-box; padding: 12px 13px; border-radius: 13px; border: 1px solid rgba(255,255,255,.14); outline: 0; background: rgba(255,255,255,.07); color: #fff; font: inherit; }
  .exclusao-conta-checkbox { display: grid; grid-template-columns: 20px minmax(0,1fr); gap: 10px; align-items: start; color: rgba(255,255,255,.75); line-height: 1.4; font-size: 13px; }
  .exclusao-conta-checkbox input { width: 18px; height: 18px; accent-color: var(--historietas-accent, #8b5cf6); }
  .exclusao-conta-erro { padding: 12px 13px; border-radius: 13px; background: rgba(127,29,29,.2); border: 1px solid rgba(248,113,113,.3); color: #fecaca; font-size: 13px; font-weight: 750; }
  .exclusao-conta-sucesso { display: grid; gap: 5px; margin-top: 16px; padding: 15px; border-radius: 15px; background: rgba(20,83,45,.23); border: 1px solid rgba(74,222,128,.28); color: #bbf7d0; }
  .exclusao-conta-enviar:disabled { opacity: .6; cursor: not-allowed; }
  .exclusao-conta-rodape { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; color: rgba(255,255,255,.45); font-size: 13px; }
  .exclusao-conta-rodape a { color: rgba(255,255,255,.7); }
  @media (max-width: 560px) { .exclusao-conta-card { padding: 18px; } .exclusao-conta-acoes { display: grid; } }
`;
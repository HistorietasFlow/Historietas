"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";

type ModoAuth = "entrar" | "criar";

function formatarErroAuth(mensagem: string) {
  const mensagemNormalizada = mensagem.toLowerCase();

  if (
    mensagemNormalizada.includes("invalid login credentials") ||
    mensagemNormalizada.includes("invalid credentials")
  ) {
    return "E-mail ou senha incorretos.";
  }

  if (mensagemNormalizada.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (mensagemNormalizada.includes("user already registered")) {
    return "Já existe uma conta com este e-mail.";
  }

  if (mensagemNormalizada.includes("password")) {
    return "A senha não atende aos requisitos necessários.";
  }

  if (mensagemNormalizada.includes("email")) {
    return "Verifique o e-mail informado.";
  }

  return "Não foi possível concluir agora. Confira os dados e tente novamente.";
}

export default function LoginPage() {
  const router = useRouter();

  const [modo, setModo] = useState<ModoAuth>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const criandoConta = modo === "criar";
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  async function salvarProfile(userId: string, nomeInformado: string) {
    const nomeDigitado = nomeInformado.trim();
    const nomePadrao = email.trim().split("@")[0] || "Usuário";

    try {
      const { data: perfilExistente } = await supabase
        .from("profiles")
        .select("nome")
        .eq("user_id", userId)
        .maybeSingle();

      const nomeExistente =
        typeof perfilExistente?.nome === "string" && perfilExistente.nome.trim()
          ? perfilExistente.nome.trim()
          : "";

      const nomeFinal = nomeDigitado || nomeExistente || nomePadrao;

      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          nome: nomeFinal,
          tipo: "autor",
          atualizado_em: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      if (!error) {
        return;
      }

      await supabase.from("profiles").upsert(
        {
          user_id: userId,
          nome: nomeFinal,
        },
        {
          onConflict: "user_id",
        }
      );
    } catch {
      // O login não pode falhar só porque o perfil não salvou.
    }
  }

  async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    if (!email.trim()) {
      setErro("Digite seu e-mail.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (criandoConta && !nome.trim()) {
      setErro("Digite seu nome de exibição.");
      return;
    }

    setCarregando(true);

    try {
      if (criandoConta) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            data: {
              nome: nome.trim(),
            },
          },
        });

        if (error) {
          setErro(formatarErroAuth(error.message));
          return;
        }

        if (data.user && data.session) {
          await salvarProfile(data.user.id, nome);
          setMensagem("Conta criada com sucesso. Redirecionando...");
          router.push("/painel-autor");
          return;
        }

        setMensagem(
          "Conta criada. Se for necessário, confirme pelo e-mail antes de entrar."
        );
        setModo("entrar");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setErro(formatarErroAuth(error.message));
        return;
      }

      if (data.user) {
        await salvarProfile(data.user.id, nome);
      }

      setMensagem("Entrada realizada. Redirecionando...");
      router.push("/painel-autor");
    } catch {
      setErro("Não foi possível concluir agora. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main style={pageThemeStyle}>
      <style>{historietasThemeCss}</style>
      <section style={containerStyle}>
        <header style={topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
          </Link>

          <span style={topBadgeStyle}>CONTA</span>
        </header>

        <section style={heroStyle}>
          <div style={heroGlowStyle} />

          <div style={heroContentStyle}>
            <div style={introStyle}>
              <span style={miniTitleStyle}>CONTA DO AUTOR</span>

              <h1 className="historietas-theme-title" style={titleStyle}>
                {criandoConta ? "Criar conta" : "Entrar na plataforma"}
              </h1>

              <p style={descriptionStyle}>
                Acesse sua conta para publicar histórias, salvar progresso,
                acompanhar obras e continuar construindo sua biblioteca na
                Historietas.
              </p>

              <div style={benefitsGridStyle} aria-label="Benefícios da conta">
                <span style={benefitPillStyle}>Publicar obras</span>
                <span style={benefitPillStyle}>Salvar progresso</span>
                <span style={benefitPillStyle}>Acompanhar leitores</span>
              </div>
            </div>

            <div style={formPanelStyle}>
              <div style={tabsStyle}>
                <button
                  type="button"
                  onClick={() => {
                    setModo("entrar");
                    setErro("");
                    setMensagem("");
                  }}
                  style={modo === "entrar" ? tabActiveStyle : tabStyle}
                >
                  Entrar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModo("criar");
                    setErro("");
                    setMensagem("");
                  }}
                  style={modo === "criar" ? tabActiveStyle : tabStyle}
                >
                  Criar conta
                </button>
              </div>

              <form onSubmit={enviarFormulario} style={formStyle}>
                {criandoConta && (
                  <label style={fieldStyle}>
                    <span style={labelStyle}>Nome de exibição</span>

                    <input
                      value={nome}
                      onChange={(event) => setNome(event.target.value)}
                      placeholder="Ex: Nome do Autor"
                      style={inputStyle}
                      type="text"
                      autoComplete="name"
                    />
                  </label>
                )}

                <label style={fieldStyle}>
                  <span style={labelStyle}>E-mail</span>

                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seuemail@email.com"
                    style={inputStyle}
                    type="email"
                    autoComplete="email"
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>Senha</span>

                  <input
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={inputStyle}
                    type="password"
                    autoComplete={criandoConta ? "new-password" : "current-password"}
                  />
                </label>

                {erro && <span style={errorStyle}>{erro}</span>}
                {mensagem && <span style={messageStyle}>{mensagem}</span>}

                <button
                  type="submit"
                  disabled={carregando}
                  style={{
                    ...primaryButtonStyle,
                    opacity: carregando ? 0.72 : 1,
                    cursor: carregando ? "not-allowed" : "pointer",
                  }}
                >
                  {carregando
                    ? "Aguarde..."
                    : criandoConta
                    ? "Criar conta"
                    : "Entrar"}
                </button>
              </form>

              <p style={helperTextStyle}>
                Use seu e-mail e senha para acessar sua conta. Se estiver criando
                uma conta nova, confirme seus dados antes de continuar.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, transparent), transparent 31%), radial-gradient(circle at 88% 14%, color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent), transparent 25%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 42%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(1120px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "clamp(12px, 2vw, 22px) 0 24px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "10px",
  minWidth: 0,
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "calc(100% - 120px)",
  overflow: "visible",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #C4B5FD) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, 0 0 26px rgba(139,92,246,0.24))",
};

const topBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 38%, rgba(255,255,255,0.08))",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.095em",
  whiteSpace: "nowrap",
  boxShadow: "none",
  ...safeTextStyle,
};

const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "28px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  background:
    "radial-gradient(circle at 16% 18%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)), transparent 30%), radial-gradient(circle at 82% 12%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, transparent)), transparent 38%), linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.98)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.99)) 100%)",
  boxShadow: "var(--historietas-hero-shadow, none)",
  minWidth: 0,
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(0,0,0,0.18) 100%)",
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "clamp(14px, 3.2vw, 34px)",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))",
  alignItems: "center",
  gap: "clamp(14px, 3vw, 30px)",
  minWidth: 0,
};

const introStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  minWidth: 0,
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.095em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px, 7.4vw, 72px)",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  maxWidth: "720px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 48%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  paddingBottom: "3px",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "clamp(12.5px, 2vw, 15px)",
  lineHeight: 1.54,
  fontWeight: 650,
  maxWidth: "620px",
  ...safeTextStyle,
};

const benefitsGridStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  marginTop: "2px",
  minWidth: 0,
};

const benefitPillStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.065))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.095))",
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const formPanelStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  width: "100%",
  maxWidth: "440px",
  justifySelf: "center",
  padding: "clamp(12px, 2.4vw, 18px)",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, var(--historietas-secondary-surface, rgba(255,255,255,0.075)) 0%, var(--historietas-surface, rgba(255,255,255,0.045)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  boxShadow: "var(--historietas-card-shadow, none)",
  boxSizing: "border-box",
  minWidth: 0,
};

const tabsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  padding: "5px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(0,0,0,0.16))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
};

const tabStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid transparent",
  background: "transparent",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const tabActiveStyle: CSSProperties = {
  ...tabStyle,
  background: "var(--historietas-accent, #F97316)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 58%, transparent)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  minWidth: 0,
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 13px",
  outline: "none",
  fontSize: "12.5px",
  fontWeight: 750,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "999px",
  border: "none",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 14px",
  boxShadow: "none",
  ...safeTextStyle,
};

const errorStyle: CSSProperties = {
  display: "block",
  padding: "9px 11px",
  borderRadius: "15px",
  background: "var(--historietas-danger-surface, rgba(239,68,68,0.12))",
  border: "1px solid color-mix(in srgb, #EF4444 28%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const messageStyle: CSSProperties = {
  display: "block",
  padding: "9px 11px",
  borderRadius: "15px",
  background: "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, #22C55E 28%, var(--historietas-border-soft, transparent))",
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const helperTextStyle: CSSProperties = {
  margin: 0,
  padding: "9px 10px",
  borderRadius: "16px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.065))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 700,
  textAlign: "center",
  ...safeTextStyle,
};

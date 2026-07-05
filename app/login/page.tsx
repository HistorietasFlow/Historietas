"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";

type ModoAuth = "entrar" | "criar";

const STORAGE_KEY = "historietas-obras";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
const AUTHOR_FOLLOW_STORAGE_KEY = "historietas-autores-seguidos";

type ErroAuthSupabase = {
  message?: string;
  code?: string;
  status?: number | string;
  name?: string;
};

function obterMensagemErroAuth(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const erroAuth = error as ErroAuthSupabase;

  return typeof erroAuth.message === "string" ? erroAuth.message.trim() : "";
}

function obterCodigoErroAuth(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const erroAuth = error as ErroAuthSupabase;

  return typeof erroAuth.code === "string" ? erroAuth.code.trim() : "";
}

function formatarErroAuth(error: unknown) {
  const mensagem = obterMensagemErroAuth(error);
  const codigo = obterCodigoErroAuth(error);
  const textoErro = [mensagem, codigo].filter(Boolean).join(" | ");
  const mensagemNormalizada = textoErro.toLowerCase();

  let mensagemAmigavel = "Não foi possível concluir agora.";

  if (
    mensagemNormalizada.includes("invalid login credentials") ||
    mensagemNormalizada.includes("invalid credentials")
  ) {
    mensagemAmigavel = "E-mail ou senha incorretos.";
  } else if (mensagemNormalizada.includes("email not confirmed")) {
    mensagemAmigavel = "Confirme seu e-mail antes de entrar.";
  } else if (
    mensagemNormalizada.includes("user already registered") ||
    mensagemNormalizada.includes("already registered") ||
    mensagemNormalizada.includes("user_already_exists") ||
    mensagemNormalizada.includes("email_exists")
  ) {
    mensagemAmigavel =
      "Já existe uma conta com este e-mail. Use Entrar ou recupere a senha.";
  } else if (
    mensagemNormalizada.includes("signup") &&
    mensagemNormalizada.includes("disabled")
  ) {
    mensagemAmigavel = "Cadastro por e-mail está desativado no Supabase.";
  } else if (
    mensagemNormalizada.includes("database error") ||
    mensagemNormalizada.includes("saving new user") ||
    mensagemNormalizada.includes("unexpected_failure")
  ) {
    mensagemAmigavel =
      "O Supabase recusou o cadastro por erro no banco, trigger ou profile.";
  } else if (
    mensagemNormalizada.includes("password") ||
    mensagemNormalizada.includes("weak_password")
  ) {
    mensagemAmigavel = "A senha não atende aos requisitos necessários.";
  } else if (mensagemNormalizada.includes("email")) {
    mensagemAmigavel = "Verifique o e-mail informado.";
  } else if (
    mensagemNormalizada.includes("failed to fetch") ||
    mensagemNormalizada.includes("network") ||
    mensagemNormalizada.includes("fetch")
  ) {
    mensagemAmigavel = "Não consegui conectar ao Supabase agora.";
  }

  if (!textoErro) {
    return `${mensagemAmigavel} Erro técnico: erro desconhecido.`;
  }

  return `${mensagemAmigavel} Erro técnico: ${textoErro}`;
}

function obterRedirectToSeguro(valor: string | null, fallback: string) {
  const destino = typeof valor === "string" ? valor.trim() : "";

  if (!destino) {
    return fallback;
  }

  if (!destino.startsWith("/") || destino.startsWith("//")) {
    return fallback;
  }

  if (destino === "/login" || destino.startsWith("/login?")) {
    return fallback;
  }

  return destino;
}

function obterRedirectToAtual(fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const params = new URLSearchParams(window.location.search);

  return obterRedirectToSeguro(params.get("redirectTo"), fallback);
}

function criarStorageUsuarioLoginKey(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

function criarStorageObrasUsuarioLoginKey(userId: string) {
  return criarStorageUsuarioLoginKey(STORAGE_KEY, userId);
}

function normalizarListaStringsLogin(valor: unknown) {
  return Array.isArray(valor)
    ? valor
        .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
        .map((item) => item.trim())
    : [];
}

function lerJsonStorageLogin(chave: string): unknown {
  const chaveLimpa = chave.trim();

  if (typeof window === "undefined" || !chaveLimpa) {
    return null;
  }

  try {
    const texto = localStorage.getItem(chaveLimpa);

    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function salvarJsonStorageLogin(chave: string, valor: unknown) {
  const chaveLimpa = chave.trim();

  if (typeof window === "undefined" || !chaveLimpa) {
    return;
  }

  try {
    localStorage.setItem(chaveLimpa, JSON.stringify(valor));
  } catch {
    // localStorage é apoio. O login não deve falhar por causa dele.
  }
}

function normalizarObrasStorageLogin(valor: unknown) {
  return Array.isArray(valor)
    ? valor.filter((obra): obra is Record<string, unknown> => {
        return Boolean(obra && typeof obra === "object" && !Array.isArray(obra));
      })
    : ([] as Record<string, unknown>[]);
}

function obterTextoRegistroLogin(registro: Record<string, unknown>, campo: string) {
  const valor = registro[campo];

  return typeof valor === "string" ? valor.trim() : "";
}

function obterAutorIdObraLogin(obra: Record<string, unknown>) {
  return (
    obterTextoRegistroLogin(obra, "autorId") ||
    obterTextoRegistroLogin(obra, "user_id") ||
    obterTextoRegistroLogin(obra, "userId") ||
    obterTextoRegistroLogin(obra, "autor_id")
  );
}

function obraPertenceAoUsuarioLogin(obra: Record<string, unknown>, userId: string) {
  const userIdLimpo = userId.trim();
  const autorId = obterAutorIdObraLogin(obra);

  return Boolean(userIdLimpo && autorId && autorId === userIdLimpo);
}

function criarChaveObraLogin(obra: Record<string, unknown>) {
  const id = obterTextoRegistroLogin(obra, "id");
  const slug = obterTextoRegistroLogin(obra, "slug");
  const titulo = obterTextoRegistroLogin(obra, "titulo");

  return id || slug || titulo.trim().toLowerCase() || JSON.stringify(obra).slice(0, 80);
}

function mesclarObrasLogin(
  obrasBase: Record<string, unknown>[],
  obrasNovas: Record<string, unknown>[],
) {
  const mapa = new Map<string, Record<string, unknown>>();

  obrasBase.forEach((obra) => {
    mapa.set(criarChaveObraLogin(obra), obra);
  });

  obrasNovas.forEach((obra) => {
    mapa.set(criarChaveObraLogin(obra), obra);
  });

  return Array.from(mapa.values());
}

function sincronizarStorageUsuarioLogin(userId: string) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || typeof window === "undefined") {
    return;
  }

  try {
    const chaveObrasUsuario = criarStorageObrasUsuarioLoginKey(userIdLimpo);
    const obrasUsuarioAtuais = normalizarObrasStorageLogin(
      lerJsonStorageLogin(chaveObrasUsuario),
    );
    const obrasUsuarioFiltradas = obrasUsuarioAtuais.filter((obra) => {
      const autorId = obterAutorIdObraLogin(obra);

      return !autorId || obraPertenceAoUsuarioLogin(obra, userIdLimpo);
    });

    salvarJsonStorageLogin(chaveObrasUsuario, obrasUsuarioFiltradas);

    [
      FAVORITES_STORAGE_KEY,
      COMPLETED_STORAGE_KEY,
      FOLLOW_STORAGE_KEY,
      AUTHOR_FOLLOW_STORAGE_KEY,
    ].forEach((chave) => {
      const chaveUsuario = criarStorageUsuarioLoginKey(chave, userIdLimpo);
      const listaUsuario = normalizarListaStringsLogin(
        lerJsonStorageLogin(chaveUsuario),
      );

      salvarJsonStorageLogin(chaveUsuario, listaUsuario);
    });
  } catch {
    // A sincronização local não pode bloquear autenticação.
  }
}

export default function LoginPage() {
  const router = useRouter();

  const [modo, setModo] = useState<ModoAuth>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const criandoConta = modo === "criar";
  const [isDesktop, setIsDesktop] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    let componenteAtivo = true;

    async function redirecionarUsuarioJaLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        if (componenteAtivo && data.user) {
          await salvarProfile(
            data.user.id,
            "",
            data.user.email || "",
            data.user.user_metadata
          );
          sincronizarStorageUsuarioLogin(data.user.id);

          router.replace(obterRedirectToAtual("/perfil-autor"));
          router.refresh();
        }
      } catch {
        // A página de login deve continuar acessível se a verificação falhar.
      }
    }

    void redirecionarUsuarioJaLogado();

    return () => {
      componenteAtivo = false;
    };
  }, [router]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

    atualizarModoDesktop();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  async function salvarProfile(
    userId: string,
    nomeInformado: string,
    emailInformado = email,
    userMetadata?: Record<string, unknown> | null
  ) {
    const userIdLimpo = userId.trim();

    if (!userIdLimpo) {
      return;
    }

    const metadata =
      userMetadata && typeof userMetadata === "object" ? userMetadata : {};
    const nomeMetadata =
      [metadata.nome, metadata.name, metadata.full_name]
        .find(
          (valor): valor is string =>
            typeof valor === "string" && Boolean(valor.trim())
        )
        ?.trim() || "";
    const emailLimpo = emailInformado.trim() || email.trim();
    const nomeFinal =
      nomeInformado.trim() ||
      nomeMetadata ||
      emailLimpo.split("@")[0] ||
      "Usuário";
    const agora = new Date().toISOString();

    try {
      const { data: perfilExistente } = await supabase
        .from("profiles")
        .select("id,user_id,nome,bio,sobre_bio,avatar_url")
        .eq("user_id", userIdLimpo)
        .limit(1)
        .maybeSingle();

      const perfilAtual =
        perfilExistente && typeof perfilExistente === "object"
          ? (perfilExistente as {
              id?: string | null;
              nome?: string | null;
              bio?: string | null;
              sobre_bio?: string | null;
              avatar_url?: string | null;
            })
          : null;
      const perfilPayload = {
        user_id: userIdLimpo,
        nome: perfilAtual?.nome?.trim() || nomeFinal,
        bio: perfilAtual?.bio?.trim() || "Perfil de leitor no Historietas.",
        sobre_bio:
          perfilAtual?.sobre_bio?.trim() ||
          perfilAtual?.bio?.trim() ||
          "Perfil de leitor no Historietas.",
        avatar_url: perfilAtual?.avatar_url || "",
        atualizado_em: agora,
      };

      if (perfilAtual?.id) {
        await supabase
          .from("profiles")
          .update(perfilPayload)
          .eq("id", perfilAtual.id);

        return;
      }

      const { error: erroUpsert } = await supabase.from("profiles").upsert(
        {
          id: userIdLimpo,
          ...perfilPayload,
        },
        { onConflict: "id" }
      );

      if (!erroUpsert) {
        return;
      }

      await supabase.from("profiles").insert(perfilPayload);
    } catch {
      // O login não pode falhar só porque o perfil não salvou.
    }
  }

  async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");

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
              name: nome.trim(),
              full_name: nome.trim(),
            },
          },
        });

        if (error) {
          setErro(formatarErroAuth(error));
          return;
        }

        if (data.user) {
          await salvarProfile(data.user.id, nome, data.user.email || email, data.user.user_metadata);
          sincronizarStorageUsuarioLogin(data.user.id);
        }

        if (data.user && data.session) {
          router.replace(obterRedirectToAtual("/perfil-autor"));
          router.refresh();
          return;
        }
        setModo("entrar");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setErro(formatarErroAuth(error));
        return;
      }

      if (data.user) {
        await salvarProfile(data.user.id, nome, data.user.email || email, data.user.user_metadata);
        sincronizarStorageUsuarioLogin(data.user.id);
      }
      router.replace(obterRedirectToAtual("/perfil-autor"));
      router.refresh();
    } catch (error) {
      setErro(formatarErroAuth(error));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${loginPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={containerStyle}>
        <header style={topStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-theme-logo-text" style={logoTextStyle}>istorietas</span>
          </Link>
        </header>

        <section style={heroStyle}>
          <div style={heroGlowStyle} />

          <div style={heroContentStyle}>
            <div style={introStyle}>
              <h1 className="historietas-theme-title" style={titleStyle}>
                {criandoConta ? "CRIAR LOGIN" : "FAZER LOGIN"}
              </h1>

              <p style={descriptionStyle}>
                Acesse sua conta para publicar histórias, salvar progresso,
                acompanhar obras e continuar construindo seu perfil do autor na
                Historietas.
              </p>
            </div>

            <div style={formPanelStyle}>
              <div style={tabsStyle}>
                <button
                  type="button"
                  onClick={() => {
                    setModo("entrar");
                    setErro("");
                  }}
                  style={modo === "entrar" ? tabActiveStyle : tabStyle}
                >
                  ENTRAR
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModo("criar");
                    setErro("");
                  }}
                  style={modo === "criar" ? tabActiveStyle : tabStyle}
                >
                  CRIAR LOGIN
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
                    ? "CRIAR"
                    : "ENTRAR"}
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

const loginPageCss = `
  html,
  body {
    overflow: hidden !important;
    overscroll-behavior: none !important;
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual="original"] input::placeholder {
    color: rgba(221, 214, 254, 0.62) !important;
  }
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100dvh",
  height: "100dvh",
  maxHeight: "100dvh",
  width: "100%",
  maxWidth: "100vw",
  overflow: "hidden",
  boxSizing: "border-box",
  background: "#070212",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(1120px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "clamp(8px, 1.6vw, 16px) 0 8px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "10px",
  minWidth: 0,
};

const logoStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: 0,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
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
  background: "#04000A",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 44%, #A78BFA 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
};

const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "visible",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  boxShadow: "none",
  minWidth: 0,
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "transparent",
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "clamp(12px, 2.4vw, 26px) clamp(18px, 3.4vw, 38px) clamp(4px, 1vw, 10px)",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  alignItems: "center",
  gap: "clamp(14px, 2.8vw, 26px)",
  transform: "translateY(clamp(8px, 1.8vh, 18px))",
  minWidth: 0,
};

const introStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "10px",
  width: "100%",
  maxWidth: "760px",
  textAlign: "center",
  minWidth: 0,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(27px, 6.6vw, 64px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  width: "100%",
  maxWidth: "760px",
  textAlign: "center",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  padding: "0 0.16em 4px",
  marginLeft: "auto",
  marginRight: "auto",
  overflow: "visible",
  overflowWrap: "normal",
  wordBreak: "normal",
  whiteSpace: "normal",
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "clamp(12.5px, 2vw, 15px)",
  lineHeight: 1.54,
  fontWeight: 650,
  maxWidth: "620px",
  textAlign: "center",
  ...safeTextStyle,
};

const formPanelStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  width: "100%",
  maxWidth: "440px",
  justifySelf: "center",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
  minWidth: 0,
};

const tabsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
};

const tabStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid rgba(59, 7, 100, 0.50)",
  background: "#04000A",
  color: "#FFFFFF",
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
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
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
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  background: "#04000A",
  color: "#FFFFFF",
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
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
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#FCA5A5",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const helperTextStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#D4D4D8",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 700,
  textAlign: "center",
  ...safeTextStyle,
};